package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.model.RecipeIngredient;
import com.mealmate.catalog.model.dto.RecipeCatalogResponse;
import com.mealmate.catalog.model.dto.RecipeCreateRequest;
import com.mealmate.catalog.model.dto.RecipeDetailResponse;
import com.mealmate.catalog.model.dto.RecipeImageUpdateRequest;
import com.mealmate.catalog.model.dto.RecipeIngredientDetailResponse;
import com.mealmate.catalog.service.RecipeService;
import com.mealmate.common.dto.ApiResponse;
import jakarta.validation.Valid;
import com.mealmate.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/catalogs/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Recipe>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<RecipeCatalogResponse>>> getCatalog(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findCatalogRecipes(resolveUserId(authentication))));
    }

    @GetMapping("/{recipeId}/detail")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> getDetail(
            @PathVariable Long recipeId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findDetail(recipeId, resolveUserId(authentication))));
    }

    @PostMapping("/{recipeId}/favorite")
    public ResponseEntity<ApiResponse<Void>> addFavorite(
            @PathVariable Long recipeId,
            Authentication authentication
    ) {
        service.updateFavorite(resolveUserId(authentication), recipeId, true);
        return ResponseEntity.ok(new ApiResponse<>(true, "Added to favorites", null));
    }

    @DeleteMapping("/{recipeId}/favorite")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable Long recipeId,
            Authentication authentication
    ) {
        service.updateFavorite(resolveUserId(authentication), recipeId, false);
        return ResponseEntity.ok(new ApiResponse<>(true, "Removed from favorites", null));
    }

    @PatchMapping("/{recipeId}/image")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> updateImage(
            @PathVariable Long recipeId,
            @Valid @RequestBody RecipeImageUpdateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated", service.updateImageUrl(recipeId, request, resolveUserId(authentication))));
    }

    @PostMapping("/full")
    public ResponseEntity<ApiResponse<RecipeDetailResponse>> createFull(
            @Valid @RequestBody RecipeCreateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.createRecipe(request, resolveUserId(authentication))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Recipe>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Recipe>> create(@RequestBody Recipe entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Recipe>> update(@PathVariable Long id, @RequestBody Recipe entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated", service.update(id, entity)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Deleted", null));
    }

    @GetMapping("/{id}/ingredients")
    public ResponseEntity<ApiResponse<List<RecipeIngredientDetailResponse>>> getIngredients(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findIngredientsByRecipeId(id)));
    }

    @PostMapping("/{id}/ingredients")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RecipeIngredient>>> updateIngredients(
            @PathVariable Long id,
            @RequestBody List<RecipeIngredient> ingredients
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated Ingredients", service.saveIngredients(id, ingredients)));
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user.getId();
    }
}
