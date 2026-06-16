package com.mealmate.recommendation.service;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.RecipeRepository;
import com.mealmate.meal.model.Meal;
import com.mealmate.meal.model.MealItem;
import com.mealmate.meal.model.Menu;
import com.mealmate.meal.repository.MealItemRepository;
import com.mealmate.meal.repository.MealRepository;
import com.mealmate.meal.repository.MenuRepository;
import com.mealmate.recommendation.config.RecommendationScoringProperties;
import com.mealmate.recommendation.dto.AddMissingIngredientsToShoppingListRequest;
import com.mealmate.recommendation.dto.AddMissingIngredientsToShoppingListResponse;
import com.mealmate.recommendation.dto.AddRecommendationToMealRequest;
import com.mealmate.recommendation.dto.AddRecommendationToMealResponse;
import com.mealmate.recommendation.dto.DeleteMealItemResponse;
import com.mealmate.recommendation.dto.GenerateMenuDraftRequest;
import com.mealmate.recommendation.dto.IngredientAvailabilityDto;
import com.mealmate.recommendation.dto.MenuDraftDayDto;
import com.mealmate.recommendation.dto.MenuDraftMealDto;
import com.mealmate.recommendation.dto.MenuDraftResponse;
import com.mealmate.recommendation.dto.MenuPlanDayDto;
import com.mealmate.recommendation.dto.MenuPlanMealDto;
import com.mealmate.recommendation.dto.MenuPlanRecipeDto;
import com.mealmate.recommendation.dto.MenuPlanResponse;
import com.mealmate.recommendation.dto.MissingIngredientDto;
import com.mealmate.recommendation.dto.RecipeRecommendationResponse;
import com.mealmate.recommendation.dto.RecommendationResponse;
import com.mealmate.recommendation.dto.UpdateMealItemRequest;
import com.mealmate.recommendation.repository.FamilyFavoriteCountProjection;
import com.mealmate.recommendation.repository.FridgeStockProjection;
import com.mealmate.recommendation.repository.MenuPlanItemProjection;
import com.mealmate.recommendation.repository.RecentRecipeProjection;
import com.mealmate.recommendation.repository.RecipeCandidateProjection;
import com.mealmate.recommendation.repository.RecipeIngredientNeedProjection;
import com.mealmate.recommendation.repository.RecommendationRepository;
import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final String STATUS_SUGGESTED = "SUGGESTED";
    private static final String STATUS_CONFIRMED = "CONFIRMED";
    private static final String MODE_DAY = "DAY";
    private static final String MODE_WEEK = "WEEK";

    private final RecommendationRepository recommendationRepository;
    private final RecipeRepository recipeRepository;
    private final FoodRepository foodRepository;
    private final MenuRepository menuRepository;
    private final MealRepository mealRepository;
    private final MealItemRepository mealItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListItemRepository shoppingListItemRepository;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final RecommendationScoringProperties scoringProperties;

    public RecommendationResponse recommendRecipes(Long familyId, Long userId, String mealType, LocalDate date, Integer limit) {
        validateFamilyAndUser(familyId, userId);
        String normalizedMealType = normalizeMealType(mealType);
        LocalDate targetDate = date == null ? LocalDate.now() : date;
        int top = limit == null || limit <= 0 ? 5 : limit;

        Map<Long, FridgeStockSnapshot> fridgeItems = getAvailableFridgeItems(familyId, targetDate);
        if (fridgeItems.isEmpty()) {
            return RecommendationResponse.builder()
                    .familyId(familyId)
                    .userId(userId)
                    .mealType(normalizedMealType)
                    .date(targetDate)
                    .recommendations(List.of())
                    .build();
        }

        List<RecipeCandidateProjection> candidates = getCandidateRecipes(normalizedMealType, fridgeItems.keySet());
        if (candidates.isEmpty()) {
            return RecommendationResponse.builder()
                    .familyId(familyId)
                    .userId(userId)
                    .mealType(normalizedMealType)
                    .date(targetDate)
                    .recommendations(List.of())
                    .build();
        }

        // Thực hiện lọc cứng: Chỉ giữ lại các công thức linh hoạt (null/trống) hoặc trùng khớp chính xác với bữa ăn đang yêu cầu
        List<RecipeCandidateProjection> strictCandidates = candidates.stream()
                .filter(recipe -> recipe.getPreferredMealTime() == null || 
                                  recipe.getPreferredMealTime().isBlank() || 
                                  recipe.getPreferredMealTime().equalsIgnoreCase(normalizedMealType))
                .toList();

        if (strictCandidates.isEmpty()) {
            return RecommendationResponse.builder()
                    .familyId(familyId)
                    .userId(userId)
                    .mealType(normalizedMealType)
                    .date(targetDate)
                    .recommendations(List.of())
                    .build();
        }

        List<Long> recipeIds = strictCandidates.stream().map(RecipeCandidateProjection::getRecipeId).toList();
        Map<Long, List<RecipeIngredientNeedProjection>> ingredientsByRecipe = groupIngredientsByRecipe(recipeIds);

        Map<Long, Integer> familyFavoriteCounts = loadFamilyFavoriteCounts(familyId, recipeIds);
        Map<Long, LocalDate> recentRecipeMap = loadRecentRecipeDates(familyId, targetDate);

        List<RecipeRecommendationResponse> recommendations = new ArrayList<>();

        for (RecipeCandidateProjection recipe : strictCandidates) {
            List<RecipeIngredientNeedProjection> ingredients = ingredientsByRecipe.get(recipe.getRecipeId());
            if (ingredients == null || ingredients.isEmpty()) {
                continue;
            }

            if (!hasAnyIngredientInFridge(ingredients, fridgeItems)) {
                continue;
            }

            ScoreComputation score = calculateRecipeScore(
                    recipe,
                    ingredients,
                    fridgeItems,
                    normalizedMealType,
                    familyFavoriteCounts,
                    recentRecipeMap,
                    targetDate,
                    familyId
            );

            recommendations.add(RecipeRecommendationResponse.builder()
                    .recipeId(recipe.getRecipeId())
                    .recipeName(recipe.getRecipeName())
                    .imageUrl(recipe.getImageUrl())
                    .difficulty(recipe.getDifficulty())
                    .score(score.finalScore())
                    .matchPercent(score.matchPercent())
                    .expiryPriorityScore(score.expiryPriorityScore())
                    .availableIngredients(score.availableIngredients())
                    .missingIngredients(score.missingIngredients())
                    .reasons(buildRecommendationReasons(score, recipe.getPreferredMealTime(), normalizedMealType))
                    .build());
        }

        List<RecipeRecommendationResponse> topRecommendations = recommendations.stream()
                .sorted(Comparator.comparing(RecipeRecommendationResponse::getMatchPercent, Comparator.reverseOrder())
                        .thenComparing(RecipeRecommendationResponse::getExpiryPriorityScore, Comparator.reverseOrder())
                        .thenComparingInt(response -> difficultyRank(response.getDifficulty()))
                        .thenComparing(RecipeRecommendationResponse::getScore, Comparator.reverseOrder())
                        .thenComparing(RecipeRecommendationResponse::getRecipeId))
                .limit(top)
                .toList();

        return RecommendationResponse.builder()
                .familyId(familyId)
                .userId(userId)
                .mealType(normalizedMealType)
                .date(targetDate)
                .recommendations(topRecommendations)
                .build();
    }

    public Map<Long, FridgeStockSnapshot> getAvailableFridgeItems(Long familyId, LocalDate date) {
        Map<Long, FridgeStockSnapshot> stockMap = new HashMap<>();
        for (FridgeStockProjection stock : recommendationRepository.findAvailableFridgeStocks(familyId, date)) {
            stockMap.put(stock.getFoodId(), new FridgeStockSnapshot(
                    stock.getFoodId(),
                    stock.getFoodName(),
                    defaultBigDecimal(stock.getAvailableQuantity()),
                    stock.getUnit(),
                    stock.getNearestExpiryDate()
            ));
        }
        return stockMap;
    }

    public List<RecipeCandidateProjection> getCandidateRecipes(String mealType, Set<Long> availableFoodIds) {
        if (availableFoodIds == null || availableFoodIds.isEmpty()) {
            // No fridge ingredients available — fallback to top recent recipes so new dishes can surface
            return recommendationRepository.findTopRecipes(20);
        }

        List<RecipeCandidateProjection> candidates = recommendationRepository.findCandidateRecipesByFoodIds(new ArrayList<>(availableFoodIds));
        if (candidates == null || candidates.isEmpty()) {
            // If ingredient-based query returns nothing, also fallback to top recipes
            return recommendationRepository.findTopRecipes(20);
        }

        return candidates;
    }

    public IngredientMatchResult calculateIngredientMatch(
            List<RecipeIngredientNeedProjection> ingredients,
            Map<Long, FridgeStockSnapshot> fridgeItems
    ) {
        if (ingredients == null || ingredients.isEmpty()) {
            return new IngredientMatchResult(0, 0, List.of(), List.of());
        }

        int matchedIngredientCount = 0;
        List<IngredientAvailabilityDto> availableIngredients = new ArrayList<>();
        List<MissingIngredientDto> missingIngredients = new ArrayList<>();

        for (RecipeIngredientNeedProjection ingredient : ingredients) {
            FridgeStockSnapshot stock = fridgeItems.get(ingredient.getFoodId());
            BigDecimal requiredQty = defaultBigDecimal(ingredient.getRequiredQuantity());
            BigDecimal availableQty = stock == null
                    ? BigDecimal.ZERO
                    : convertQuantity(stock.availableQuantity(), stock.unit(), ingredient.getUnit());
            BigDecimal comparableAvailableQty = availableQty == null ? BigDecimal.ZERO : availableQty;

            if (comparableAvailableQty.compareTo(requiredQty) >= 0) {
                matchedIngredientCount++;
                availableIngredients.add(IngredientAvailabilityDto.builder()
                        .foodId(ingredient.getFoodId())
                        .name(ingredient.getFoodName())
                        .requiredQuantity(requiredQty)
                        .availableQuantity(comparableAvailableQty)
                        .unit(resolveUnit(ingredient.getUnit(), stock == null ? null : stock.unit()))
                        .build());
            } else {
                missingIngredients.add(MissingIngredientDto.builder()
                        .foodId(ingredient.getFoodId())
                        .name(ingredient.getFoodName())
                        .requiredQuantity(requiredQty)
                        .missingQuantity(requiredQty.subtract(comparableAvailableQty).max(BigDecimal.ZERO))
                        .unit(resolveUnit(ingredient.getUnit(), stock == null ? null : stock.unit()))
                        .build());
            }
        }

        return new IngredientMatchResult(matchedIngredientCount, ingredients.size(), availableIngredients, missingIngredients);
    }

    public int calculateExpiryPriority(
            List<RecipeIngredientNeedProjection> ingredients,
            Map<Long, FridgeStockSnapshot> fridgeItems,
            LocalDate date
    ) {
        int totalScore = 0;

        for (RecipeIngredientNeedProjection ingredient : ingredients) {
            FridgeStockSnapshot stock = fridgeItems.get(ingredient.getFoodId());
            if (stock == null || stock.nearestExpiryDate() == null) {
                continue;
            }

            long daysLeft = ChronoUnit.DAYS.between(date, stock.nearestExpiryDate());
            if (daysLeft < 0) {
                continue;
            }

            totalScore += switch ((int) daysLeft) {
                case 0, 1 -> scoringProperties.getExpiryScoreWithin1Day();
                case 2 -> scoringProperties.getExpiryScoreWithin2Days();
                case 3 -> scoringProperties.getExpiryScoreWithin3Days();
                case 4, 5 -> scoringProperties.getExpiryScoreWithin5Days();
                default -> 0;
            };

            if (totalScore >= scoringProperties.getExpiryMaxScore()) {
                return scoringProperties.getExpiryMaxScore();
            }
        }

        return Math.min(totalScore, scoringProperties.getExpiryMaxScore());
    }

    public int calculateFavoriteScore(Long recipeId, Map<Long, Integer> familyFavoriteCounts) {
        int favoriteMemberCount = familyFavoriteCounts.getOrDefault(recipeId, 0);
        return favoriteMemberCount * scoringProperties.getFavoriteScorePerMember();
    }

    public int calculateRecentRecipePenalty(Long familyId, Long recipeId, LocalDate date, Map<Long, LocalDate> recentRecipeMap) {
        LocalDate latestMealDate = recentRecipeMap.get(recipeId);
        if (latestMealDate == null) {
            return 0;
        }

        long daysDiff = ChronoUnit.DAYS.between(latestMealDate, date);
        if (daysDiff <= 0) {
            return scoringProperties.getRecentPenaltyYesterday();
        }
        if (daysDiff == 1) {
            return scoringProperties.getRecentPenaltyYesterday();
        }
        if (daysDiff <= 3) {
            return scoringProperties.getRecentPenaltyWithin3Days();
        }
        if (daysDiff <= 7) {
            return scoringProperties.getRecentPenaltyWithin7Days();
        }
        return 0;
    }

    public List<String> buildRecommendationReasons(ScoreComputation score, String preferredMealTime, String mealType) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Co " + score.matchedIngredientCount() + "/" + score.totalIngredientCount() + " nguyen lieu trong tu lanh");

        if (!score.missingIngredients().isEmpty()) {
            reasons.add("Thieu " + score.missingIngredients().size() + " nguyen lieu");
        }

        if (score.expiryPriorityScore() > 0) {
            reasons.add("Co nguyen lieu sap het han nen uu tien su dung");
        }

        if (preferredMealTime == null || preferredMealTime.isBlank()) {
            reasons.add("Cong thuc linh hoat cho nhieu bua an");
        } else if (preferredMealTime.equalsIgnoreCase(mealType)) {
            reasons.add("Phu hop voi bua " + mealType.toLowerCase(Locale.ROOT));
        } else {
            reasons.add("Khong phai bua uu tien cua cong thuc");
        }

        if (score.favoriteScore() > 0) {
            reasons.add("Co " + score.favoriteMemberCount() + " thanh vien gia dinh yeu thich mon nay");
        }

        if (score.recentRecipePenalty() > 0) {
            reasons.add("Mon nay da xuat hien gan day trong thuc don");
        }

        return reasons;
    }

    public MenuDraftResponse generateMenuDraft(GenerateMenuDraftRequest request) {
        validateFamilyAndUser(request.getFamilyId(), request.getUserId());

        String mode = normalizeDraftMode(request.getMode());
        LocalDate startDate = request.getStartDate();
        int dayCount = mode.equals(MODE_WEEK) ? 7 : 1;
        int candidateLimit = request.getCandidateLimit() == null || request.getCandidateLimit() < 5
                ? 12
                : Math.min(request.getCandidateLimit(), 30);

        Map<Long, List<LocalDate>> selectedRecipeDates = new HashMap<>();
        Map<LocalDate, Set<String>> selectedRecipeNamesByDate = new HashMap<>();

        // Load already-saved menu items in the requested range so we can penalize saved recipes more strongly
        Map<Long, List<LocalDate>> savedRecipeDates = new HashMap<>();
        List<MenuPlanItemProjection> existingItems = recommendationRepository.findMenuPlanItems(
                request.getFamilyId(), startDate, startDate.plusDays(dayCount - 1)
        );
        for (MenuPlanItemProjection item : existingItems) {
            if (item.getRecipeId() != null) {
                savedRecipeDates.computeIfAbsent(item.getRecipeId(), k -> new ArrayList<>()).add(item.getMealDate());
                selectedRecipeNamesByDate.computeIfAbsent(item.getMealDate(), k -> new HashSet<>()).add(normalizeRecipeNameKey(item.getRecipeName()));
            }
        }
        List<MenuDraftDayDto> days = new ArrayList<>();

        for (int dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            LocalDate date = startDate.plusDays(dayIndex);
            List<MenuDraftMealDto> meals = new ArrayList<>();

            for (String mealType : List.of("BREAKFAST", "LUNCH", "DINNER")) {
                RecommendationResponse candidates = recommendRecipes(
                        request.getFamilyId(),
                        request.getUserId(),
                        mealType,
                        date,
                        candidateLimit
                );

                RecipeRecommendationResponse selected = selectWeightedDraftCandidate(
                    candidates.getRecommendations(),
                    selectedRecipeDates,
                    savedRecipeDates,
                    selectedRecipeNamesByDate,
                    date
                );

                if (selected != null) {
                    selectedRecipeDates.computeIfAbsent(selected.getRecipeId(), key -> new ArrayList<>()).add(date);
                    selectedRecipeNamesByDate.computeIfAbsent(date, key -> new HashSet<>()).add(normalizeRecipeNameKey(selected.getRecipeName()));
                }

                meals.add(MenuDraftMealDto.builder()
                        .mealType(mealType)
                        .recommendation(selected)
                        .build());
            }

            days.add(MenuDraftDayDto.builder()
                    .date(date)
                    .meals(meals)
                    .build());
        }

        return MenuDraftResponse.builder()
                .familyId(request.getFamilyId())
                .userId(request.getUserId())
                .mode(mode)
                .startDate(startDate)
                .endDate(startDate.plusDays(dayCount - 1L))
                .days(days)
                .build();
    }

        private RecipeRecommendationResponse selectWeightedDraftCandidate(
            List<RecipeRecommendationResponse> candidates,
            Map<Long, List<LocalDate>> selectedRecipeDates,
            Map<Long, List<LocalDate>> savedRecipeDates,
            Map<LocalDate, Set<String>> selectedRecipeNamesByDate,
            LocalDate date
        ) {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        List<RecipeRecommendationResponse> rankedCandidates = candidates.stream()
            // always include candidates, but apply penalty when the recipe already exists in saved plan or in the draft selections
            .map(candidate -> applyInDraftPenalty(
                candidate,
                selectedRecipeDates.getOrDefault(candidate.getRecipeId(), List.of()),
                savedRecipeDates.getOrDefault(candidate.getRecipeId(), List.of()),
                date
            ))
                .sorted(Comparator.comparing(RecipeRecommendationResponse::getMatchPercent, Comparator.reverseOrder())
                        .thenComparing(RecipeRecommendationResponse::getExpiryPriorityScore, Comparator.reverseOrder())
                        .thenComparingInt(response -> difficultyRank(response.getDifficulty()))
                        .thenComparing(RecipeRecommendationResponse::getScore, Comparator.reverseOrder())
                        .thenComparing(RecipeRecommendationResponse::getRecipeId))
                .limit(Math.max(1, scoringProperties.getDraftRandomPoolSize()))
                .toList();

        if (rankedCandidates.isEmpty()) {
            return null;
        }

        return pickCandidateByRankWeight(rankedCandidates);
    }

    private RecipeRecommendationResponse pickCandidateByRankWeight(List<RecipeRecommendationResponse> rankedCandidates) {
        int totalWeight = 0;
        List<Integer> weights = new ArrayList<>();
        for (int index = 0; index < rankedCandidates.size(); index++) {
            int weight = Math.max(1, getDraftRankWeight(index));
            weights.add(weight);
            totalWeight += weight;
        }

        int randomValue = ThreadLocalRandom.current().nextInt(totalWeight);
        int cursor = 0;
        for (int index = 0; index < rankedCandidates.size(); index++) {
            cursor += weights.get(index);
            if (randomValue < cursor) {
                RecipeRecommendationResponse selected = rankedCandidates.get(index);
                List<String> reasons = new ArrayList<>(selected.getReasons() == null ? List.of() : selected.getReasons());
                reasons.add("Duoc chon ngau nhien tu top " + rankedCandidates.size() + " mon diem cao voi trong so uu tien");
                return copyRecommendationWithReasons(selected, reasons);
            }
        }

        return rankedCandidates.getFirst();
    }

    private String normalizeRecipeNameKey(String recipeName) {
        return recipeName == null ? "" : recipeName.trim().toLowerCase(Locale.ROOT);
    }

    private int getDraftRankWeight(int zeroBasedRank) {
        return switch (zeroBasedRank) {
            case 0 -> scoringProperties.getDraftRandomRank1Weight();
            case 1 -> scoringProperties.getDraftRandomRank2Weight();
            case 2 -> scoringProperties.getDraftRandomRank3Weight();
            case 3 -> scoringProperties.getDraftRandomRank4Weight();
            default -> 1;
        };
    }

    private RecipeRecommendationResponse applyInDraftPenalty(
            RecipeRecommendationResponse candidate,
            List<LocalDate> draftSelectedDates,
            List<LocalDate> savedDates,
            LocalDate date
    ) {
        int draftPenalty = calculateInDraftPenalty(draftSelectedDates, date);
        int savedPenalty = calculateInDraftPenalty(savedDates, date);

        // Saved occurrences should be penalized more strongly
        int penalty = Math.max(draftPenalty, savedPenalty * 2);
        if (penalty <= 0) {
            return candidate;
        }

        List<String> reasons = new ArrayList<>(candidate.getReasons() == null ? List.of() : candidate.getReasons());
        if (savedPenalty > 0) {
            reasons.add("Tru " + (savedPenalty * 2) + " diem vi mon da xuat hien trong thuc don da luu");
        }
        if (draftPenalty > 0) {
            reasons.add("Tru " + draftPenalty + " diem vi mon da xuat hien trong ban nhap thuc don tuan");
        }

        return copyRecommendationWithReasons(
                RecipeRecommendationResponse.builder()
                        .recipeId(candidate.getRecipeId())
                        .recipeName(candidate.getRecipeName())
                        .imageUrl(candidate.getImageUrl())
                        .difficulty(candidate.getDifficulty())
                        .score(candidate.getScore() - penalty)
                        .matchPercent(candidate.getMatchPercent())
                        .expiryPriorityScore(candidate.getExpiryPriorityScore())
                        .availableIngredients(candidate.getAvailableIngredients())
                        .missingIngredients(candidate.getMissingIngredients())
                        .reasons(candidate.getReasons())
                        .build(),
                reasons
        );
    }

    private RecipeRecommendationResponse copyRecommendationWithReasons(
            RecipeRecommendationResponse candidate,
            List<String> reasons
    ) {
        return RecipeRecommendationResponse.builder()
                .recipeId(candidate.getRecipeId())
                .recipeName(candidate.getRecipeName())
                .imageUrl(candidate.getImageUrl())
                .difficulty(candidate.getDifficulty())
                .score(candidate.getScore())
                .matchPercent(candidate.getMatchPercent())
                .expiryPriorityScore(candidate.getExpiryPriorityScore())
                .availableIngredients(candidate.getAvailableIngredients())
                .missingIngredients(candidate.getMissingIngredients())
                .reasons(reasons)
                .build();
    }

    private int calculateInDraftPenalty(List<LocalDate> selectedDates, LocalDate date) {
        int maxPenalty = 0;
        for (LocalDate selectedDate : selectedDates) {
            long daysDiff = ChronoUnit.DAYS.between(selectedDate, date);
            if (daysDiff == 0) {
                maxPenalty = Math.max(maxPenalty, 100);
            } else if (daysDiff == 1) {
                maxPenalty = Math.max(maxPenalty, 25);
            } else if (daysDiff > 1 && daysDiff <= 3) {
                maxPenalty = Math.max(maxPenalty, 18);
            } else if (daysDiff > 3 && daysDiff <= 7) {
                maxPenalty = Math.max(maxPenalty, 12);
            }
        }
        return maxPenalty;
    }

    public MenuPlanResponse getMenuPlan(Long familyId, Long userId, LocalDate startDate, LocalDate endDate) {
        validateFamilyAndUser(familyId, userId);
        LocalDate fromDate = startDate == null ? LocalDate.now() : startDate;
        LocalDate toDate = endDate == null ? fromDate : endDate;
        if (toDate.isBefore(fromDate)) {
            throw new ResponseStatusException(BAD_REQUEST, "endDate must be after or equal startDate");
        }

        List<MenuPlanItemProjection> items = recommendationRepository.findMenuPlanItems(familyId, fromDate, toDate);
        Map<LocalDate, Map<String, List<MenuPlanRecipeDto>>> grouped = items.stream()
                .collect(Collectors.groupingBy(
                        MenuPlanItemProjection::getMealDate,
                        Collectors.groupingBy(
                                item -> normalizeMealType(item.getMealType()),
                                Collectors.mapping(this::toMenuPlanRecipeDto, Collectors.toList())
                        )
                ));

        List<MenuPlanDayDto> days = new ArrayList<>();
        for (LocalDate current = fromDate; !current.isAfter(toDate); current = current.plusDays(1)) {
            Map<String, List<MenuPlanRecipeDto>> mealsByType = grouped.getOrDefault(current, Map.of());
            List<MenuPlanMealDto> meals = List.of("BREAKFAST", "LUNCH", "DINNER").stream()
                    .map(mealType -> MenuPlanMealDto.builder()
                            .mealType(mealType)
                            .recipes(mealsByType.getOrDefault(mealType, List.of()))
                            .build())
                    .toList();

            days.add(MenuPlanDayDto.builder()
                    .date(current)
                    .meals(meals)
                    .build());
        }

        return MenuPlanResponse.builder()
                .familyId(familyId)
                .userId(userId)
                .startDate(fromDate)
                .endDate(toDate)
                .days(days)
                .build();
    }

    private MenuPlanRecipeDto toMenuPlanRecipeDto(MenuPlanItemProjection item) {
        return MenuPlanRecipeDto.builder()
                .mealItemId(item.getMealItemId())
                .recipeId(item.getRecipeId())
                .recipeName(item.getRecipeName())
                .imageUrl(item.getImageUrl())
                .status(item.getStatus())
                .build();
    }

    @Transactional
    public AddRecommendationToMealResponse addToMeal(Long recipeId, AddRecommendationToMealRequest request) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipe not found"));

        Family family = familyRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Family not found"));

        String mealType = normalizeMealType(request.getMealType());
        String status = normalizeMealItemStatus(request.getStatus());
        LocalDate mealDate = request.getDate();

        Meal meal = getOrCreateMeal(family, mealDate, mealType);

        MealItem mealItem = mealItemRepository.findByMeal_IdAndRecipe_Id(meal.getId(), recipeId)
                .orElseGet(() -> {
                    MealItem newItem = new MealItem();
                    newItem.setMeal(meal);
                    newItem.setRecipe(recipe);
                    return newItem;
                });

        mealItem.setStatus(status);
        mealItem = mealItemRepository.save(mealItem);

        return AddRecommendationToMealResponse.builder()
                .menuId(meal.getMenu().getId())
                .mealId(meal.getId())
                .mealItemId(mealItem.getId())
                .status(mealItem.getStatus())
                .build();
    }

    @Transactional
    public AddRecommendationToMealResponse updateMealItem(Long mealItemId, UpdateMealItemRequest request) {
        validateFamilyAndUser(request.getFamilyId(), request.getUserId());

        MealItem mealItem = mealItemRepository.findById(mealItemId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Meal item not found"));

        ensureMealItemBelongsToFamily(mealItem, request.getFamilyId());

        Recipe recipe = recipeRepository.findById(request.getRecipeId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipe not found"));

        Family family = familyRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Family not found"));

        String mealType = normalizeMealType(request.getMealType());
        String status = normalizeMealItemStatus(request.getStatus());
        Meal targetMeal = getOrCreateMeal(family, request.getDate(), mealType);

        Optional<MealItem> duplicate = mealItemRepository.findByMeal_IdAndRecipe_Id(targetMeal.getId(), recipe.getId());
        if (duplicate.isPresent() && !duplicate.get().getId().equals(mealItem.getId())) {
            MealItem existingItem = duplicate.get();
            existingItem.setStatus(status);
            existingItem = mealItemRepository.save(existingItem);
            mealItemRepository.delete(mealItem);

            return AddRecommendationToMealResponse.builder()
                    .menuId(targetMeal.getMenu().getId())
                    .mealId(targetMeal.getId())
                    .mealItemId(existingItem.getId())
                    .status(existingItem.getStatus())
                    .build();
        }

        mealItem.setMeal(targetMeal);
        mealItem.setRecipe(recipe);
        mealItem.setStatus(status);
        mealItem = mealItemRepository.save(mealItem);

        return AddRecommendationToMealResponse.builder()
                .menuId(targetMeal.getMenu().getId())
                .mealId(targetMeal.getId())
                .mealItemId(mealItem.getId())
                .status(mealItem.getStatus())
                .build();
    }

    @Transactional
    public DeleteMealItemResponse deleteMealItem(Long mealItemId, Long familyId, Long userId) {
        validateFamilyAndUser(familyId, userId);

        MealItem mealItem = mealItemRepository.findById(mealItemId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Meal item not found"));
        ensureMealItemBelongsToFamily(mealItem, familyId);

        mealItemRepository.delete(mealItem);
        return DeleteMealItemResponse.builder()
                .mealItemId(mealItemId)
                .deleted(true)
                .build();
    }

    @Transactional
    public AddMissingIngredientsToShoppingListResponse addMissingIngredientsToShoppingList(
            Long recipeId,
            AddMissingIngredientsToShoppingListRequest request
    ) {
        validateFamilyAndUser(request.getFamilyId(), request.getUserId());
        recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipe not found"));

        List<MissingIngredientDto> missingIngredients = calculateMissingIngredients(
                recipeId,
                request.getFamilyId(),
                request.getDate()
        );

        if (missingIngredients.isEmpty()) {
            return AddMissingIngredientsToShoppingListResponse.builder()
                    .shoppingListId(null)
                    .recipeId(recipeId)
                    .addedItemCount(0)
                    .addedItems(List.of())
                    .build();
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Family family = familyRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Family not found"));

        ShoppingList shoppingList = shoppingListRepository.findTopByFamily_IdOrderByCreatedDateDescCreatedAtDesc(family.getId())
                .orElseGet(() -> {
                    ShoppingList list = new ShoppingList();
                    list.setFamily(family);
                    list.setCreatedBy(user);
                    list.setCreatedDate(LocalDate.now());
                    list.setPlannedDate(Optional.ofNullable(request.getPlannedDate()).orElse(LocalDate.now()));
                    list.setNote(request.getNote());
                    return shoppingListRepository.save(list);
                });

        List<ShoppingListItem> itemsToSave = new ArrayList<>();
        for (MissingIngredientDto missing : missingIngredients) {
            Food food = foodRepository.findById(missing.getFoodId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Food not found: " + missing.getFoodId()));

            ShoppingListItem item = new ShoppingListItem();
            item.setShoppingList(shoppingList);
            item.setFood(food);
            item.setQuantity(missing.getMissingQuantity().doubleValue());
            item.setUnit(missing.getUnit());
            item.setNote("Auto-added from recommendation recipeId=" + recipeId);
            item.setAssignedTo(user);
            item.setIsPurchased(false);
            itemsToSave.add(item);
        }

        shoppingListItemRepository.saveAll(itemsToSave);

        return AddMissingIngredientsToShoppingListResponse.builder()
                .shoppingListId(shoppingList.getId())
                .recipeId(recipeId)
                .addedItemCount(itemsToSave.size())
                .addedItems(missingIngredients)
                .build();
    }

    private ScoreComputation calculateRecipeScore(
            RecipeCandidateProjection recipe,
            List<RecipeIngredientNeedProjection> ingredients,
            Map<Long, FridgeStockSnapshot> fridgeItems,
            String mealType,
            Map<Long, Integer> familyFavoriteCounts,
            Map<Long, LocalDate> recentRecipeMap,
            LocalDate date,
            Long familyId
    ) {
        IngredientMatchResult ingredientMatch = calculateIngredientMatch(ingredients, fridgeItems);
        int ingredientMatchScore = ingredientMatch.totalIngredientCount() == 0
                ? 0
                : Math.round(((float) ingredientMatch.matchedIngredientCount() / ingredientMatch.totalIngredientCount())
                * scoringProperties.getIngredientMatchMaxScore());

        int missingPenalty = Math.min(
                ingredientMatch.missingIngredients().size() * scoringProperties.getMissingPenaltyPerIngredient(),
                scoringProperties.getMissingPenaltyMaxScore()
        );
        int expiryPriorityScore = calculateExpiryPriority(ingredients, fridgeItems, date);
        int mealTypeScore = calculateMealTypeScore(recipe.getPreferredMealTime(), mealType);
        int favoriteMemberCount = familyFavoriteCounts.getOrDefault(recipe.getRecipeId(), 0);
        int favoriteScore = calculateFavoriteScore(recipe.getRecipeId(), familyFavoriteCounts);
        int recentPenalty = calculateRecentRecipePenalty(familyId, recipe.getRecipeId(), date, recentRecipeMap);

        int finalScore = ingredientMatchScore
                + expiryPriorityScore
                + mealTypeScore
                + favoriteScore
                - missingPenalty
                - recentPenalty;

        int matchPercent = ingredientMatch.totalIngredientCount() == 0
                ? 0
                : Math.round(((float) ingredientMatch.matchedIngredientCount() / ingredientMatch.totalIngredientCount()) * 100);

        return new ScoreComputation(
                ingredientMatch.matchedIngredientCount(),
                ingredientMatch.totalIngredientCount(),
                ingredientMatchScore,
                missingPenalty,
                expiryPriorityScore,
                mealTypeScore,
                favoriteMemberCount,
                favoriteScore,
                recentPenalty,
                finalScore,
                matchPercent,
                ingredientMatch.availableIngredients(),
                ingredientMatch.missingIngredients()
        );
    }

    private Map<Long, List<RecipeIngredientNeedProjection>> groupIngredientsByRecipe(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<RecipeIngredientNeedProjection>> grouped = new HashMap<>();
        for (RecipeIngredientNeedProjection ingredient : recommendationRepository.findIngredientsByRecipeIds(recipeIds)) {
            grouped.computeIfAbsent(ingredient.getRecipeId(), key -> new ArrayList<>()).add(ingredient);
        }
        return grouped;
    }

    private Map<Long, Integer> loadFamilyFavoriteCounts(Long familyId, List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Integer> favoriteCounts = new HashMap<>();
        for (FamilyFavoriteCountProjection favorite : recommendationRepository.findFamilyFavoriteCounts(familyId, recipeIds)) {
            Long count = favorite.getFavoriteCount();
            favoriteCounts.put(favorite.getRecipeId(), count == null ? 0 : count.intValue());
        }
        return favoriteCounts;
    }

    private Map<Long, LocalDate> loadRecentRecipeDates(Long familyId, LocalDate date) {
        // Quét lịch sử ngược về quá khứ 7 ngày trước để tìm các món đã ăn (CONFIRMED)
        LocalDate fromDate = date.minusDays(7);
        
        // Quét tiến lên phía trước 7 ngày để tóm gọn toàn bộ các món nằm chờ trong bản nháp tuần (SUGGESTED)
        LocalDate toDate = date.plusDays(7);

        if (toDate.isBefore(fromDate)) {
            return Map.of();
        }

        Map<Long, LocalDate> recentRecipeMap = new HashMap<>();
        // Hàm này giờ trả về cả ngày gần nhất của món đã ăn lẫn món chuẩn bị lên lịch
        for (RecentRecipeProjection recent : recommendationRepository.findRecentRecipes(familyId, fromDate, toDate)) {
            recentRecipeMap.put(recent.getRecipeId(), recent.getLatestMealDate());
        }
        return recentRecipeMap;
    }

    private boolean hasAnyIngredientInFridge(
            List<RecipeIngredientNeedProjection> ingredients,
            Map<Long, FridgeStockSnapshot> fridgeItems
    ) {
        for (RecipeIngredientNeedProjection ingredient : ingredients) {
            FridgeStockSnapshot stock = fridgeItems.get(ingredient.getFoodId());
            if (stock != null && stock.availableQuantity() != null && stock.availableQuantity().compareTo(BigDecimal.ZERO) > 0) {
                return true;
            }
        }
        return false;
    }

    private List<MissingIngredientDto> calculateMissingIngredients(Long recipeId, Long familyId, LocalDate date) {
        Map<Long, FridgeStockSnapshot> fridgeItems = getAvailableFridgeItems(familyId, date);
        List<RecipeIngredientNeedProjection> ingredients = recommendationRepository.findIngredientsByRecipeIds(List.of(recipeId));
        if (ingredients.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Recipe has no ingredients");
        }

        return calculateIngredientMatch(ingredients, fridgeItems).missingIngredients();
    }

    private int calculateMealTypeScore(String recipePreferredMealType, String requestMealType) {
        if (recipePreferredMealType == null || recipePreferredMealType.isBlank()) {
            return scoringProperties.getMealTypeNullScore();
        }

        if (recipePreferredMealType.equalsIgnoreCase(requestMealType)) {
            return scoringProperties.getMealTypeMatchScore();
        }

        return scoringProperties.getMealTypeMismatchScore();
    }

    private int difficultyRank(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return 3;
        }

        return switch (difficulty.trim().toUpperCase(Locale.ROOT)) {
            case "EASY" -> 0;
            case "MEDIUM" -> 1;
            case "HARD" -> 2;
            default -> 3;
        };
    }

    private String normalizeMealType(String mealType) {
        if (mealType == null) {
            throw new ResponseStatusException(BAD_REQUEST, "mealType is required");
        }

        String normalized = mealType.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("BREAKFAST", "LUNCH", "DINNER").contains(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "mealType must be BREAKFAST, LUNCH, or DINNER");
        }

        return normalized;
    }

    private String normalizeDraftMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return MODE_DAY;
        }

        String normalized = mode.trim().toUpperCase(Locale.ROOT);
        if (!Set.of(MODE_DAY, MODE_WEEK).contains(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "mode must be DAY or WEEK");
        }
        return normalized;
    }

    private String normalizeMealItemStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_SUGGESTED;
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of(STATUS_SUGGESTED, STATUS_CONFIRMED).contains(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "status must be SUGGESTED or CONFIRMED");
        }

        return normalized;
    }

    private void validateFamilyAndUser(Long familyId, Long userId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Family not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Long userFamilyId = user.getFamilyId();
        if (userFamilyId == null || !userFamilyId.equals(family.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "User does not belong to this family");
        }
    }

    private Meal getOrCreateMeal(Family family, LocalDate mealDate, String mealType) {
        Menu menu = menuRepository.findFirstByFamily_IdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        family.getId(),
                        mealDate,
                        mealDate
                )
                .orElseGet(() -> {
                    Menu newMenu = new Menu();
                    newMenu.setFamily(family);
                    newMenu.setStartDate(mealDate.with(DayOfWeek.MONDAY));
                    newMenu.setEndDate(mealDate.with(DayOfWeek.SUNDAY));
                    return menuRepository.save(newMenu);
                });

        return mealRepository.findByMenu_IdAndMealDateAndMealType(menu.getId(), mealDate, mealType)
                .orElseGet(() -> {
                    Meal newMeal = new Meal();
                    newMeal.setMenu(menu);
                    newMeal.setMealDate(mealDate);
                    newMeal.setMealType(mealType);
                    return mealRepository.save(newMeal);
                });
    }

    private void ensureMealItemBelongsToFamily(MealItem mealItem, Long familyId) {
        Long itemFamilyId = Optional.ofNullable(mealItem.getMeal())
                .map(Meal::getMenu)
                .map(Menu::getFamily)
                .map(Family::getId)
                .orElse(null);

        if (itemFamilyId == null || !itemFamilyId.equals(familyId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Meal item does not belong to this family");
        }
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal convertQuantity(BigDecimal quantity, String fromUnit, String toUnit) {
        if (quantity == null) {
            return null;
        }

        String from = normalizeUnit(fromUnit);
        String to = normalizeUnit(toUnit);

        if (from == null && to == null) {
            return quantity;
        }

        if (from == null || to == null) {
            return null;
        }

        if (from.equals(to)) {
            return quantity;
        }

        BigDecimal fromFactor = unitFactorToBase(from);
        BigDecimal toFactor = unitFactorToBase(to);
        String fromGroup = unitGroup(from);
        String toGroup = unitGroup(to);

        if (fromFactor == null || toFactor == null || fromGroup == null || !fromGroup.equals(toGroup)) {
            return null;
        }

        return quantity.multiply(fromFactor).divide(toFactor, MathContext.DECIMAL64);
    }

    private String normalizeUnit(String unit) {
        if (unit == null || unit.trim().isEmpty()) {
            return null;
        }

        return unit.trim().toLowerCase(Locale.ROOT);
    }

    private String unitGroup(String unit) {
        return switch (unit) {
            case "mg", "g", "kg" -> "mass";
            case "ml", "l", "lit", "liter", "litre", "lít" -> "volume";
            default -> null;
        };
    }

    private BigDecimal unitFactorToBase(String unit) {
        return switch (unit) {
            case "mg" -> new BigDecimal("0.001");
            case "g" -> BigDecimal.ONE;
            case "kg" -> new BigDecimal("1000");
            case "ml" -> BigDecimal.ONE;
            case "l", "lit", "liter", "litre", "lít" -> new BigDecimal("1000");
            default -> null;
        };
    }

    private String resolveUnit(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        return fallback;
    }

    public record FridgeStockSnapshot(
            Long foodId,
            String foodName,
            BigDecimal availableQuantity,
            String unit,
            LocalDate nearestExpiryDate
    ) {
    }

    public record IngredientMatchResult(
            int matchedIngredientCount,
            int totalIngredientCount,
            List<IngredientAvailabilityDto> availableIngredients,
            List<MissingIngredientDto> missingIngredients
    ) {
    }

    public record ScoreComputation(
            int matchedIngredientCount,
            int totalIngredientCount,
            int ingredientMatchScore,
            int missingPenalty,
            int expiryPriorityScore,
            int mealTypeScore,
            int favoriteMemberCount,
            int favoriteScore,
            int recentRecipePenalty,
            int finalScore,
            int matchPercent,
            List<IngredientAvailabilityDto> availableIngredients,
            List<MissingIngredientDto> missingIngredients
    ) {
    }
}