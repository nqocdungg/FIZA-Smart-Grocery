package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.RecipeIngredient;
import com.mealmate.catalog.service.RecipeIngredientService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs/recipeingredients")
@RequiredArgsConstructor
public class RecipeIngredientController {

    private final RecipeIngredientService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecipeIngredient>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RecipeIngredient>> create(@RequestBody RecipeIngredient entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
