package com.mealmate.fridge.service;

import com.mealmate.catalog.repository.RecipeIngredientRepository;
import com.mealmate.catalog.repository.RecipeSuggestionProjection;
import com.mealmate.catalog.repository.UserFavoriteRecipeRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.fridge.mapper.FridgeItemMapper;
import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import com.mealmate.fridge.model.RemoveReason;
import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeOverviewResponse;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.model.dto.ImportShoppingItemRequest;
import com.mealmate.fridge.model.dto.ImportShoppingItemsRequest;
import com.mealmate.fridge.model.dto.ImportShoppingItemsResponse;
import com.mealmate.fridge.model.dto.RecipeSuggestionIngredientResponse;
import com.mealmate.fridge.model.dto.RecipeSuggestionResponse;
import com.mealmate.fridge.model.dto.RemoveFridgeItemRequest;
import com.mealmate.fridge.model.dto.ShoppingImportCandidateResponse;
import com.mealmate.fridge.model.dto.UpdateFridgeItemRequest;
import com.mealmate.fridge.repository.FridgeItemProjection;
import com.mealmate.fridge.repository.FridgeItemRepository;
import com.mealmate.notification.model.NotificationCategory;
import com.mealmate.notification.model.NotificationSeverity;
import com.mealmate.notification.service.NotificationService;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.repository.ShoppingImportCandidateProjection;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class FridgeItemService {

    private final FridgeItemRepository fridgeItemRepository;
    private final FridgeItemMapper fridgeItemMapper;
    private final ShoppingListItemRepository shoppingListItemRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final UserFavoriteRecipeRepository userFavoriteRecipeRepository;
    private final FoodRepository foodRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public FridgeItemService(
            FridgeItemRepository fridgeItemRepository,
            FridgeItemMapper fridgeItemMapper,
            ShoppingListItemRepository shoppingListItemRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            UserFavoriteRecipeRepository userFavoriteRecipeRepository,
            FoodRepository foodRepository,
            NotificationService notificationService,
            UserRepository userRepository
    ) {
        this.fridgeItemRepository = fridgeItemRepository;
        this.fridgeItemMapper = fridgeItemMapper;
        this.shoppingListItemRepository = shoppingListItemRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.userFavoriteRecipeRepository = userFavoriteRecipeRepository;
        this.foodRepository = foodRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /** Gửi thông báo tủ lạnh đến tất cả thành viên trong gia đình (trừ người thực hiện). */
    private void notifyFamilyExcept(Long familyId, Long excludeUserId,
                                    String severity, String title, String body) {
        try {
            userRepository.findByFamily_IdOrderByIdAsc(familyId).stream()
                    .filter(u -> !u.getId().equals(excludeUserId))
                    .forEach(u -> notificationService.push(
                            u.getId(), NotificationCategory.FRIDGE, severity, title, body));
        } catch (Exception ex) {
            // Không để lỗi notification làm sập luồng chính
        }
    }

    public List<FridgeItemResponse> getStoredItems() {
        Long familyId = getCurrentFamilyIdOrThrow();

        return fridgeItemRepository
                .findByFamilyIdAndStatusWithFoodName(familyId, FridgeItemStatus.STORED)
                .stream()
                .map(fridgeItemMapper::toResponse)
                .toList();
    }

    public List<FridgeItemResponse> searchStoredItems(String keyword, Long categoryId) {
        if ((keyword == null || keyword.trim().isEmpty()) && categoryId == null) {
            return getStoredItems();
        }

        Long familyId = getCurrentFamilyIdOrThrow();
        String normalizedKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();

        List<FridgeItemProjection> items = fridgeItemRepository.searchStoredItems(
                familyId,
                FridgeItemStatus.STORED,
                normalizedKeyword,
                categoryId
        );

        return items.stream()
                .map(fridgeItemMapper::toResponse)
                .toList();
    }

    @Transactional
    public FridgeItemResponse create(CreateFridgeItemRequest request) {
        validateCreateRequest(request);

        User currentUser = getCurrentUserOrThrow();
        Long familyId = currentUser.getFamilyId();
        if (familyId == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No family");

        FridgeItem item = fridgeItemMapper.toEntity(request);
        item.setFamilyId(familyId);
        item.setStatus(FridgeItemStatus.STORED);
        item.setUnit(resolveFridgeUnit(request.getFoodId(), request.getUnit()));

        FridgeItem saved = fridgeItemRepository.save(item);

        // Thông báo cho các thành viên còn lại trong gia đình
        String itemName = saved.getCustomName() != null ? saved.getCustomName() : "một thực phẩm";
        notifyFamilyExcept(familyId, currentUser.getId(),
                NotificationSeverity.NORMAL,
                "🧊 Tủ lạnh được cập nhật",
                currentUser.getFullName() + " đã thêm \"" + itemName + "\" vào tủ lạnh.");

        return toDetailedResponse(saved);
    }

    @Transactional
    public FridgeItemResponse update(Long id, UpdateFridgeItemRequest request) {
        FridgeItem item = fridgeItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fridge item not found"));
        assertCurrentFamilyOwns(item);

        if (FridgeItemStatus.REMOVED.equals(item.getStatus())) {
            throw new IllegalStateException("Removed fridge item cannot be updated");
        }

        Long updatedFoodId = request.getFoodId() != null ? request.getFoodId() : item.getFoodId();
        if (request.getFoodId() != null) {
            item.setFoodId(updatedFoodId);
        }
        if (request.getCustomName() != null) {
            item.setCustomName(normalizeBlank(request.getCustomName()));
        }
        if (request.getQuantity() != null) {
            item.setQuantity(request.getQuantity());
        }
        if (request.getStorageLocation() != null) {
            item.setStorageLocation(normalizeBlank(request.getStorageLocation()));
        }
        if (request.getSpecificLocation() != null) {
            item.setSpecificLocation(normalizeBlank(request.getSpecificLocation()));
        }
        if (request.getAddedDate() != null) {
            item.setAddedDate(request.getAddedDate());
        }
        if (request.getExpiryDate() != null) {
            item.setExpiryDate(request.getExpiryDate());
        }
        if (request.getImageUrl() != null) {
            item.setImageUrl(normalizeBlank(request.getImageUrl()));
        }
        if (request.getNote() != null) {
            item.setNote(normalizeBlank(request.getNote()));
        }
        if (request.getUnit() != null || request.getFoodId() != null) {
            item.setUnit(resolveFridgeUnit(
                    updatedFoodId,
                    request.getUnit() != null ? request.getUnit() : item.getUnit()
            ));
        }

        FridgeItem saved = fridgeItemRepository.save(item);
        return toDetailedResponse(saved);
    }

    @Transactional
    public FridgeItemResponse remove(Long id, RemoveFridgeItemRequest request) {
        validateRemoveRequest(request);

        User currentUser = getCurrentUserOrThrow();
        FridgeItem item = fridgeItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fridge item not found"));
        assertCurrentFamilyOwns(item);

        if (FridgeItemStatus.REMOVED.equals(item.getStatus())) {
            return toDetailedResponse(item);
        }

        item.setStatus(FridgeItemStatus.REMOVED);
        item.setRemovedReason(request.getRemovedReason());
        item.setRemovedReasonNote(normalizeBlank(request.getRemovedReasonNote()));
        item.setRemovedBy(currentUser.getId());
        item.setRemovedAt(LocalDateTime.now());

        FridgeItem saved = fridgeItemRepository.save(item);

        // Thông báo cho các thành viên còn lại
        String removedName = saved.getCustomName() != null ? saved.getCustomName() : "một thực phẩm";
        notifyFamilyExcept(saved.getFamilyId(), currentUser.getId(),
                NotificationSeverity.NORMAL,
                "🗑️ Thực phẩm đã được lấy ra",
                currentUser.getFullName() + " đã lấy \"" + removedName + "\" ra khỏi tủ lạnh.");

        return toDetailedResponse(saved);
    }

    public long countStoredItems() {
        return fridgeItemRepository.countStoredByFamilyId(getCurrentFamilyIdOrThrow());
    }

    public FridgeOverviewResponse getOverview() {
        Long familyId = getCurrentFamilyIdOrThrow();
        List<FridgeItemProjection> items = fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(
                familyId,
                FridgeItemStatus.STORED
        );

        LocalDate today = LocalDate.now();
        FridgeOverviewResponse response = new FridgeOverviewResponse();

        long expiredCount = items.stream()
                .filter(item -> item.getExpiryDate() != null && item.getExpiryDate().isBefore(today))
                .count();
        long expiringSoonCount = items.stream()
                .filter(item -> item.getExpiryDate() != null
                        && !item.getExpiryDate().isBefore(today)
                        && !item.getExpiryDate().isAfter(today.plusDays(3)))
                .count();
        long almostOutCount = items.stream()
                .filter(item -> isAlmostOut(item.getQuantity(), item.getUnit()))
                .count();

        response.setTotalStored(items.size());
        response.setExpiredCount(expiredCount);
        response.setExpiringSoonCount(expiringSoonCount);
        response.setAlmostOutCount(almostOutCount);
        response.setStatus(resolveOverviewStatus(items.size(), expiredCount, expiringSoonCount, almostOutCount));

        return response;
    }

    public List<ShoppingImportCandidateResponse> getShoppingImportCandidates() {
        Long familyId = getCurrentFamilyIdOrThrow();

        return fridgeItemRepository.findShoppingImportCandidates(familyId)
                .stream()
                .map(this::toShoppingImportCandidateResponse)
                .toList();
    }

    @Transactional
    public void skipShoppingImportCandidate(Long shoppingListItemId) {
        Long familyId = getCurrentFamilyIdOrThrow();

        ShoppingListItem shoppingItem = shoppingListItemRepository.findImportableByIdAndFamilyId(
                        shoppingListItemId,
                        familyId
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shopping list item not found"));

        if (!Boolean.TRUE.equals(shoppingItem.getIsPurchased())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shopping list item is not purchased");
        }

        if (shoppingItem.getImportedToFridgeAt() != null) {
            return;
        }

        shoppingItem.setImportedToFridgeAt(LocalDateTime.now());
        shoppingItem.setFridgeItem(null);
        shoppingListItemRepository.save(shoppingItem);
    }

    public List<RecipeSuggestionResponse> getRecipeSuggestions(int limit) {
        // Gợi ý món ăn: chỉ hiển thị các công thức tận dụng được thực phẩm đang có,
        // ưu tiên công thức có phần trăm nguyên liệu khớp cao nhất.
        return buildRecipeResponses(limit, true);
    }

    public List<RecipeSuggestionResponse> getRecipeLibrary(int limit) {
        // Thư viện công thức: hiển thị toàn bộ công thức (kể cả khi tủ chưa có nguyên liệu),
        // vẫn kèm phần trăm khớp so với tủ lạnh hiện tại.
        return buildRecipeResponses(limit, false);
    }

    private List<RecipeSuggestionResponse> buildRecipeResponses(int limit, boolean onlyMatched) {
        Long familyId = getCurrentFamilyIdOrThrow();
        int normalizedLimit = Math.max(1, Math.min(limit, 200));
        LocalDate today = LocalDate.now();

        Map<Long, IngredientStock> stockByFoodId = buildStockByFoodId(
                fridgeItemRepository.findByFamilyIdAndStatusWithFoodName(familyId, FridgeItemStatus.STORED),
                today
        );

        Set<Long> favoriteRecipeIds = loadFavoriteRecipeIdsSafely();

        Map<Long, RecipeSuggestionDraft> draftsByRecipeId = new LinkedHashMap<>();
        findRecipeSuggestionRowsSafely().forEach(row -> {
            RecipeSuggestionDraft draft = draftsByRecipeId.computeIfAbsent(
                    row.getRecipeId(),
                    recipeId -> new RecipeSuggestionDraft(row)
            );
            draft.ingredients.add(row);
        });

        return draftsByRecipeId.values()
                .stream()
                .map(draft -> toRecipeSuggestionResponse(draft, stockByFoodId, today, favoriteRecipeIds))
                .filter(response -> !onlyMatched || response.getCoveragePercent() > 0)
                .sorted(
                        // Sort by match percent first, then expiring ingredients, then easier recipes.
                        Comparator.comparingInt(RecipeSuggestionResponse::getCoveragePercent).reversed()
                                .thenComparing(
                                        Comparator.<RecipeSuggestionResponse>comparingInt(
                                                response -> response.getExpiringIngredients().size()
                                        ).reversed()
                                )
                                .thenComparingInt(response -> difficultyRank(response.getDifficulty()))
                                .thenComparing(RecipeSuggestionResponse::getName)
                )
                .limit(normalizedLimit)
                .toList();
    }

    private List<RecipeSuggestionProjection> findRecipeSuggestionRowsSafely() {
        try {
            return recipeIngredientRepository.findRecipeSuggestionRows();
        } catch (DataAccessException error) {
            return recipeIngredientRepository.findRecipeSuggestionRowsLegacy();
        }
    }

    private Set<Long> loadFavoriteRecipeIdsSafely() {
        try {
            return new HashSet<>(userFavoriteRecipeRepository.findRecipeIdsByUserId(getCurrentUserOrThrow().getId()));
        } catch (DataAccessException error) {
            return Set.of();
        }
    }

    @Transactional
    public ImportShoppingItemsResponse importFromShopping(ImportShoppingItemsRequest request) {
        Long familyId = getCurrentFamilyIdOrThrow();

        List<FridgeItemResponse> importedItems = request.getItems()
                .stream()
                .map(itemRequest -> importSingleShoppingItem(familyId, itemRequest))
                .toList();

        ImportShoppingItemsResponse response = new ImportShoppingItemsResponse();
        response.setImportedCount(importedItems.size());
        response.setItems(importedItems);
        return response;
    }

    private void validateCreateRequest(CreateFridgeItemRequest request) {
        if (request.getFoodId() == null) {
            throw new IllegalArgumentException("foodId is required");
        }

        if (request.getQuantity() == null || request.getQuantity().signum() <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }
    }

    private String resolveFridgeUnit(Long foodId, String requestedUnit) {
        if (foodId == null) {
            return null;
        }

        String configuredUnits = foodRepository.findById(foodId)
                .map(food -> normalizeBlank(food.getUnit()))
                .orElse(null);
        if (configuredUnits == null) {
            return null;
        }

        List<String> unitOptions = Arrays.stream(configuredUnits.split(","))
                .map(this::normalizeBlank)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (unitOptions.isEmpty()) {
            return null;
        }

        String normalizedRequestedUnit = normalizeBlank(requestedUnit);
        if (normalizedRequestedUnit == null) {
            return unitOptions.get(0);
        }
        if (normalizedRequestedUnit.contains(",")) {
            normalizedRequestedUnit = normalizeBlank(normalizedRequestedUnit.split(",")[0]);
        }

        String requestedUnitOption = normalizedRequestedUnit;
        return unitOptions.stream()
                .filter(unit -> unit.equalsIgnoreCase(requestedUnitOption))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "unit is not configured for the selected food"
                ));
    }

    private FridgeItemResponse importSingleShoppingItem(Long familyId, ImportShoppingItemRequest request) {
        validateShoppingImportRequest(request);

        ShoppingListItem shoppingItem = shoppingListItemRepository.findImportableByIdAndFamilyId(
                        request.getShoppingListItemId(),
                        familyId
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shopping list item not found"));

        if (!Boolean.TRUE.equals(shoppingItem.getIsPurchased())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shopping list item is not purchased");
        }

        if (shoppingItem.getImportedToFridgeAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shopping list item was already imported");
        }

        if (shoppingItem.getFood() == null || !shoppingItem.getFood().getId().equals(request.getFoodId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "foodId does not match the shopping list item");
        }

        FridgeItem fridgeItem = new FridgeItem();
        fridgeItem.setFamilyId(familyId);
        fridgeItem.setFoodId(request.getFoodId());
        fridgeItem.setCustomName(normalizeBlank(request.getCustomName()));
        fridgeItem.setQuantity(request.getQuantity());
        fridgeItem.setStorageLocation(normalizeBlank(request.getStorageLocation()));
        fridgeItem.setSpecificLocation(normalizeBlank(request.getSpecificLocation()));
        fridgeItem.setAddedDate(request.getAddedDate() == null ? LocalDate.now() : request.getAddedDate());
        fridgeItem.setExpiryDate(request.getExpiryDate());
        fridgeItem.setStatus(FridgeItemStatus.STORED);
        fridgeItem.setNote(normalizeBlank(request.getNote()));
        String importUnit = resolveShoppingImportUnit(
                request.getUnit() != null ? request.getUnit() : shoppingItem.getUnit()
        );
        if (importUnit == null) {
            throw new IllegalArgumentException("unit is required");
        }
        fridgeItem.setUnit(importUnit);

        FridgeItem savedFridgeItem = fridgeItemRepository.save(fridgeItem);

        shoppingItem.setImportedToFridgeAt(LocalDateTime.now());
        shoppingItem.setFridgeItem(savedFridgeItem);
        shoppingListItemRepository.save(shoppingItem);

        return toDetailedResponse(savedFridgeItem);
    }

    private void validateShoppingImportRequest(ImportShoppingItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity().signum() <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }

        if (request.getStorageLocation() == null || request.getStorageLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("storageLocation is required");
        }

        if (request.getExpiryDate() == null) {
            throw new IllegalArgumentException("expiryDate is required");
        }
    }

    private ShoppingImportCandidateResponse toShoppingImportCandidateResponse(
            ShoppingImportCandidateProjection projection
    ) {
        ShoppingImportCandidateResponse response = new ShoppingImportCandidateResponse();

        response.setShoppingListItemId(projection.getShoppingListItemId());
        response.setShoppingListId(projection.getShoppingListId());
        response.setPlannedDate(projection.getPlannedDate());
        response.setFoodId(projection.getFoodId());
        response.setFoodName(projection.getFoodName());
        response.setCustomName(projection.getCustomName());
        response.setCategoryId(projection.getCategoryId());
        response.setCategoryName(projection.getCategoryName());
        response.setCategoryIconKey(projection.getCategoryIconKey());
        response.setCategoryColorCode(projection.getCategoryColorCode());
        response.setQuantity(projection.getQuantity());
        response.setUnit(resolveShoppingImportUnit(projection.getUnit()));
        response.setNote(projection.getNote());
        response.setImportedToFridgeAt(projection.getImportedToFridgeAt());

        return response;
    }

    private String resolveShoppingImportUnit(String unit) {
        String normalizedUnit = normalizeBlank(unit);
        if (normalizedUnit == null) {
            return null;
        }
        if (!normalizedUnit.contains(",")) {
            return normalizedUnit;
        }
        return normalizeBlank(normalizedUnit.split(",")[0]);
    }

    private Map<Long, IngredientStock> buildStockByFoodId(List<FridgeItemProjection> items, LocalDate today) {
        Map<Long, IngredientStock> stockByFoodId = new LinkedHashMap<>();

        items.forEach(item -> {
            if (item.getFoodId() == null || item.getQuantity() == null) {
                return;
            }

            if (item.getExpiryDate() != null && item.getExpiryDate().isBefore(today)) {
                return;
            }

            IngredientStock stock = stockByFoodId.computeIfAbsent(
                    item.getFoodId(),
                    foodId -> new IngredientStock(item.getUnit())
            );

            if (isSameUnit(stock.unit, item.getUnit())) {
                stock.quantity = stock.quantity.add(item.getQuantity());
            }

            if (item.getExpiryDate() != null
                    && (stock.nearestExpiryDate == null || item.getExpiryDate().isBefore(stock.nearestExpiryDate))) {
                stock.nearestExpiryDate = item.getExpiryDate();
            }
        });

        return stockByFoodId;
    }

    private RecipeSuggestionResponse toRecipeSuggestionResponse(
            RecipeSuggestionDraft draft,
            Map<Long, IngredientStock> stockByFoodId,
            LocalDate today,
            Set<Long> favoriteRecipeIds
    ) {
        List<RecipeSuggestionIngredientResponse> matchedIngredients = new ArrayList<>();
        List<RecipeSuggestionIngredientResponse> missingIngredients = new ArrayList<>();
        List<RecipeSuggestionIngredientResponse> expiringIngredients = new ArrayList<>();

        draft.ingredients.forEach(ingredient -> {
            IngredientStock stock = stockByFoodId.get(ingredient.getFoodId());
            RecipeSuggestionIngredientResponse ingredientResponse = toRecipeSuggestionIngredientResponse(
                    ingredient,
                    stock,
                    today
            );

            if (stock != null) {
                matchedIngredients.add(ingredientResponse);
            }

            if (Boolean.TRUE.equals(ingredientResponse.getExpiringSoon())) {
                expiringIngredients.add(ingredientResponse);
            }

            if (!Boolean.TRUE.equals(ingredientResponse.getSufficientQuantity())) {
                missingIngredients.add(ingredientResponse);
            }
        });

        int totalIngredients = Math.max(draft.ingredients.size(), 1);
        int sufficientCount = totalIngredients - missingIngredients.size();
        int coveragePercent = (int) Math.round((sufficientCount * 100.0) / totalIngredients);
        double coverageRatio = sufficientCount / (double) totalIngredients;
        double quantityRatio = sufficientCount / (double) totalIngredients;
        double urgencyRatio = expiringIngredients.size() / (double) totalIngredients;
        int score = (int) Math.round(
                coverageRatio * 55
                        + quantityRatio * 30
                        + urgencyRatio * 15
                        - missingIngredients.size() * 5
        );

        RecipeSuggestionResponse response = new RecipeSuggestionResponse();
        response.setRecipeId(draft.recipeId);
        response.setName(draft.recipeName);
        response.setImageUrl(draft.imageUrl);
        response.setDescription(draft.description);
        response.setInstructions(draft.instructions);
        response.setReferenceLink(draft.referenceLink);
        response.setAuthor(draft.author);
        response.setCookingTimeMinutes(draft.cookingTimeMinutes);
        response.setServings(draft.servings);
        response.setCalories(draft.calories);
        response.setDifficulty(draft.difficulty);
        response.setPreferredMealTime(draft.preferredMealTime);
        response.setIngredientCount(draft.ingredients.size());
        response.setScore(Math.max(0, Math.min(score, 100)));
        response.setCoveragePercent(Math.max(0, Math.min(coveragePercent, 100)));
        response.setCanCook(missingIngredients.isEmpty());
        response.setFavorite(favoriteRecipeIds.contains(draft.recipeId));
        response.setMatchedIngredients(matchedIngredients);
        response.setMissingIngredients(missingIngredients);
        response.setExpiringIngredients(expiringIngredients);

        return response;
    }

    private RecipeSuggestionIngredientResponse toRecipeSuggestionIngredientResponse(
            RecipeSuggestionProjection ingredient,
            IngredientStock stock,
            LocalDate today
    ) {
        BigDecimal requiredQuantity = ingredient.getRequiredQuantity() == null
                ? BigDecimal.ZERO
                : ingredient.getRequiredQuantity();
        BigDecimal comparableAvailableQuantity = stock == null
                ? null
                : convertQuantity(stock.quantity, stock.unit, ingredient.getRequiredUnit());
        boolean hasCompatibleQuantity = comparableAvailableQuantity != null
                && comparableAvailableQuantity.compareTo(requiredQuantity) >= 0;
        boolean expiringSoon = stock != null
                && stock.nearestExpiryDate != null
                && !stock.nearestExpiryDate.isBefore(today)
                && !stock.nearestExpiryDate.isAfter(today.plusDays(3));

        RecipeSuggestionIngredientResponse response = new RecipeSuggestionIngredientResponse();
        response.setFoodId(ingredient.getFoodId());
        response.setFoodName(ingredient.getFoodName());
        response.setRequiredQuantity(requiredQuantity);
        response.setRequiredUnit(ingredient.getRequiredUnit());
        response.setAvailableQuantity(stock == null ? null : stock.quantity);
        response.setAvailableUnit(stock == null ? null : stock.unit);
        response.setSufficientQuantity(hasCompatibleQuantity);
        response.setExpiringSoon(expiringSoon);
        response.setNearestExpiryDate(stock == null ? null : stock.nearestExpiryDate);

        return response;
    }

    private boolean isSameUnit(String firstUnit, String secondUnit) {
        String first = normalizeBlank(firstUnit);
        String second = normalizeBlank(secondUnit);

        if (first == null && second == null) {
            return true;
        }

        if (first == null || second == null) {
            return false;
        }

        return first.equalsIgnoreCase(second);
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
        String normalized = normalizeBlank(unit);
        if (normalized == null) {
            return null;
        }

        return normalized.toLowerCase(Locale.ROOT);
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

    private void validateRemoveRequest(RemoveFridgeItemRequest request) {
        if (request.getRemovedReason() == null || request.getRemovedReason().trim().isEmpty()) {
            throw new IllegalArgumentException("removedReason is required");
        }

        String removedReason = request.getRemovedReason().trim();

        if (!List.of(
                RemoveReason.USED_UP,
                RemoveReason.EXPIRED_DISCARDED,
                RemoveReason.SPOILED,
                RemoveReason.WRONG_INFO,
                RemoveReason.OTHER
        ).contains(removedReason)) {
            throw new IllegalArgumentException("removedReason is invalid");
        }

        request.setRemovedReason(removedReason);

        if (RemoveReason.OTHER.equals(removedReason)
                && (request.getRemovedReasonNote() == null || request.getRemovedReasonNote().trim().isEmpty())) {
            throw new IllegalArgumentException("removedReasonNote is required when removedReason is OTHER");
        }
    }

    private FridgeItemResponse toDetailedResponse(FridgeItem item) {
        if (item.getId() == null) {
            return fridgeItemMapper.toResponse(item);
        }

        return fridgeItemRepository.findDetailedById(item.getId())
                .map(fridgeItemMapper::toResponse)
                .orElseGet(() -> fridgeItemMapper.toResponse(item));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private boolean isAlmostOut(BigDecimal quantity, String unit) {
        if (quantity == null) {
            return false;
        }

        BigDecimal threshold = getAlmostOutThreshold(unit);
        return quantity.compareTo(threshold) <= 0;
    }

    private BigDecimal getAlmostOutThreshold(String unit) {
        if (unit == null || unit.trim().isEmpty()) {
            return BigDecimal.ONE;
        }

        String normalizedUnit = unit.trim().toLowerCase(Locale.ROOT);

        return switch (normalizedUnit) {
            case "g" -> new BigDecimal("100");
            case "kg" -> new BigDecimal("0.1");
            case "ml" -> new BigDecimal("200");
            case "l", "lit", "lít" -> new BigDecimal("0.2");
            case "quả" -> new BigDecimal("2");
            case "hộp", "gói", "chai", "lon", "cái", "bó" -> BigDecimal.ONE;
            default -> BigDecimal.ONE;
        };
    }

    private String resolveOverviewStatus(long totalStored, long expiredCount, long expiringSoonCount, long almostOutCount) {
        if (totalStored == 0) {
            return "EMPTY";
        }

        if (expiredCount > 0 || expiringSoonCount > 0 || almostOutCount > 0) {
            return "NEEDS_ATTENTION";
        }

        return "HAPPY";
    }

    private User getCurrentUserOrThrow() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user is invalid");
    }

    private Long getCurrentFamilyIdOrThrow() {
        Long familyId = getCurrentUserOrThrow().getFamilyId();
        if (familyId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current user does not belong to a family");
        }
        return familyId;
    }

    private void assertCurrentFamilyOwns(FridgeItem item) {
        Long familyId = getCurrentFamilyIdOrThrow();
        if (!familyId.equals(item.getFamilyId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fridge item not found");
        }
    }

    private static class IngredientStock {
        private BigDecimal quantity = BigDecimal.ZERO;
        private final String unit;
        private LocalDate nearestExpiryDate;

        private IngredientStock(String unit) {
            this.unit = unit;
        }
    }

    private static class RecipeSuggestionDraft {
        private final Long recipeId;
        private final String recipeName;
        private final String imageUrl;
        private final String description;
        private final String instructions;
        private final String referenceLink;
        private final String author;
        private final Integer cookingTimeMinutes;
        private final Integer servings;
        private final Integer calories;
        private final String difficulty;
        private final String preferredMealTime;
        private final List<RecipeSuggestionProjection> ingredients = new ArrayList<>();

        private RecipeSuggestionDraft(RecipeSuggestionProjection projection) {
            this.recipeId = projection.getRecipeId();
            this.recipeName = projection.getRecipeName();
            this.imageUrl = projection.getImageUrl();
            this.description = projection.getDescription();
            this.instructions = projection.getInstructions();
            this.referenceLink = projection.getReferenceLink();
            this.author = projection.getAuthor();
            this.cookingTimeMinutes = projection.getCookingTimeMinutes();
            this.servings = projection.getServings();
            this.calories = projection.getCalories();
            this.difficulty = projection.getDifficulty();
            this.preferredMealTime = projection.getPreferredMealTime();
        }
    }
}
