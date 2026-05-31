package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.service.RecipeService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.mealmate.catalog.model.RecipeIngredient;
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
    public ResponseEntity<ApiResponse<List<RecipeIngredient>>> getIngredients(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findIngredientsByRecipeId(id)));
    }

    @PostMapping("/{id}/ingredients")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RecipeIngredient>>> updateIngredients(@PathVariable Long id, @RequestBody List<RecipeIngredient> ingredients) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated Ingredients", service.saveIngredients(id, ingredients)));
    }
}
