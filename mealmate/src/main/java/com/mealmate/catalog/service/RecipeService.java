package com.mealmate.catalog.service;

import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.model.RecipeIngredient;
import com.mealmate.catalog.model.dto.RecipeCatalogResponse;
import com.mealmate.catalog.model.dto.RecipeCreateRequest;
import com.mealmate.catalog.model.dto.RecipeDetailResponse;
import com.mealmate.catalog.model.dto.RecipeImageUpdateRequest;
import com.mealmate.catalog.model.dto.RecipeIngredientDetailResponse;
import com.mealmate.catalog.model.dto.RecipeIngredientRequest;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.RecipeIngredientDetailProjection;
import com.mealmate.catalog.repository.RecipeIngredientRepository;
import com.mealmate.catalog.repository.RecipeIngredientSummaryProjection;
import com.mealmate.catalog.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository repository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final FoodRepository foodRepository;

    public List<Recipe> findAll() {
        return repository.findAll();
    }

    public Recipe findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));
    }

    @Transactional
    public Recipe save(Recipe entity) {
        return repository.save(entity);
    }

    @Transactional
    public Recipe update(Long id, Recipe request) {
        Recipe recipe = findById(id);
        recipe.setName(request.getName());
        recipe.setInstructions(request.getInstructions());
        recipe.setReferenceLink(request.getReferenceLink());
        recipe.setAuthor(request.getAuthor());
        recipe.setPreferredMealTime(request.getPreferredMealTime());
        recipe.setCookingTimeMinutes(request.getCookingTimeMinutes());
        recipe.setDisplayStatus(request.getDisplayStatus());
        recipe.setImageUrl(request.getImageUrl());
        return repository.save(recipe);
    }

    @Transactional
    public void delete(Long id) {
        Recipe recipe = findById(id);
        repository.delete(recipe);
    }

    public List<RecipeIngredient> findIngredientsByRecipeId(Long recipeId) {
        return recipeIngredientRepository.findByRecipeId(recipeId);
    }

    @Transactional
    public List<RecipeIngredient> saveIngredients(Long recipeId, List<RecipeIngredient> ingredients) {
        Recipe recipe = findById(recipeId);
        recipeIngredientRepository.deleteByRecipeId(recipeId);
        for (RecipeIngredient ingredient : ingredients) {
            ingredient.setRecipe(recipe);
        }
        return recipeIngredientRepository.saveAll(ingredients);
    }

    @Transactional(readOnly = true)
    public List<RecipeCatalogResponse> findCatalogRecipes(Long userId) {
        List<Recipe> recipes = repository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        if (recipes.isEmpty()) {
            return List.of();
        }

        Map<String, Recipe> uniqueRecipesByName = new LinkedHashMap<>();
        for (Recipe recipe : recipes) {
            if (recipe == null || recipe.getName() == null) {
                continue;
            }
            uniqueRecipesByName.putIfAbsent(recipe.getName().trim().toLowerCase(), recipe);
        }

        recipes = new ArrayList<>(uniqueRecipesByName.values());

        List<Long> recipeIds = recipes.stream()
                .map(Recipe::getId)
                .toList();

        Map<Long, List<String>> ingredientsByRecipeId = new LinkedHashMap<>();
        for (RecipeIngredientSummaryProjection ingredient : recipeIngredientRepository.findIngredientNamesByRecipeIds(recipeIds)) {
            ingredientsByRecipeId
                    .computeIfAbsent(ingredient.getRecipeId(), ignored -> new ArrayList<>())
                    .add(ingredient.getFoodName());
        }

        Set<Long> favoriteRecipeIds = userId == null
                ? Set.of()
                : new HashSet<>(repository.findFavoriteRecipeIds(userId));

        return recipes.stream()
                .map(recipe -> RecipeCatalogResponse.builder()
                        .id(recipe.getId())
                        .name(recipe.getName())
                        .imageUrl(recipe.getImageUrl())
                        .preferredMealTime(recipe.getPreferredMealTime())
                        .cookingTimeMinutes(recipe.getCookingTimeMinutes())
                        .displayStatus(recipe.getDisplayStatus())
                        .favorite(favoriteRecipeIds.contains(recipe.getId()))
                        .ingredients(ingredientsByRecipeId.getOrDefault(recipe.getId(), List.of()))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipeDetailResponse findDetail(Long recipeId, Long userId) {
        Recipe recipe = repository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipe not found: " + recipeId));

        Set<Long> favoriteRecipeIds = userId == null
                ? Set.of()
                : new HashSet<>(repository.findFavoriteRecipeIds(userId));

        return toDetailResponse(recipe, favoriteRecipeIds.contains(recipeId));
    }

    @Transactional
    public void updateFavorite(Long userId, Long recipeId, boolean favorite) {
        if (userId == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "User is required");
        }

        if (!repository.existsById(recipeId)) {
            throw new ResponseStatusException(NOT_FOUND, "Recipe not found: " + recipeId);
        }

        if (favorite) {
            repository.addFavoriteRecipe(userId, recipeId);
        } else {
            repository.removeFavoriteRecipe(userId, recipeId);
        }
    }

    @Transactional
    public RecipeDetailResponse updateImageUrl(Long recipeId, RecipeImageUpdateRequest request, Long userId) {
        Recipe recipe = repository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipe not found: " + recipeId));

        recipe.setImageUrl(normalizeBlank(request.getImageUrl()));
        Recipe savedRecipe = repository.save(recipe);
        return toDetailResponse(savedRecipe, isFavorite(userId, recipeId));
    }

    @Transactional
    public RecipeDetailResponse createRecipe(RecipeCreateRequest request, Long userId) {
        Recipe recipe = new Recipe();
        recipe.setName(normalizeBlank(request.getName()));
        recipe.setInstructions(normalizeBlank(request.getInstructions()));
        recipe.setReferenceLink(normalizeBlank(request.getReferenceLink()));
        recipe.setAuthor(normalizeBlank(request.getAuthor()));
        recipe.setImageUrl(normalizeBlank(request.getImageUrl()));
        recipe.setPreferredMealTime(normalizeBlank(request.getPreferredMealTime()));
        recipe.setCookingTimeMinutes(request.getCookingTimeMinutes());
        recipe.setDisplayStatus(userId == null ? "SYSTEM" : "CUSTOM");

        Recipe savedRecipe = repository.save(recipe);
        saveCreateIngredients(savedRecipe, request.getIngredients());

        return toDetailResponse(savedRecipe, false);
    }

    private void saveCreateIngredients(Recipe recipe, List<RecipeIngredientRequest> ingredientRequests) {
        if (ingredientRequests == null || ingredientRequests.isEmpty()) {
            return;
        }

        List<RecipeIngredient> ingredients = ingredientRequests.stream()
                .map(request -> {
                    RecipeIngredient ingredient = new RecipeIngredient();
                    ingredient.setRecipe(recipe);
                    ingredient.setFood(foodRepository.findById(request.getFoodId())
                            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Food not found: " + request.getFoodId())));
                    ingredient.setQuantity(request.getQuantity());
                    ingredient.setUnit(normalizeBlank(request.getUnit()));
                    return ingredient;
                })
                .toList();

        recipeIngredientRepository.saveAll(ingredients);
    }

    private RecipeDetailResponse toDetailResponse(Recipe recipe, boolean favorite) {
        List<RecipeIngredientDetailResponse> ingredients = recipeIngredientRepository.findIngredientDetailsByRecipeId(recipe.getId())
                .stream()
                .map(this::toIngredientResponse)
                .toList();

        return RecipeDetailResponse.builder()
                .id(recipe.getId())
                .name(recipe.getName())
                .instructions(recipe.getInstructions())
                .referenceLink(recipe.getReferenceLink())
                .author(recipe.getAuthor())
                .preferredMealTime(recipe.getPreferredMealTime())
                .cookingTimeMinutes(recipe.getCookingTimeMinutes())
                .displayStatus(recipe.getDisplayStatus())
                .imageUrl(recipe.getImageUrl())
                .favorite(favorite)
                .ingredients(ingredients)
                .build();
    }

    private boolean isFavorite(Long userId, Long recipeId) {
        return userId != null && repository.findFavoriteRecipeIds(userId).contains(recipeId);
    }

    private RecipeIngredientDetailResponse toIngredientResponse(RecipeIngredientDetailProjection projection) {
        return RecipeIngredientDetailResponse.builder()
                .foodId(projection.getFoodId())
                .foodName(projection.getFoodName())
                .quantity(projection.getQuantity())
                .unit(projection.getUnit())
                .build();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }
}
