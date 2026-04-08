package com.mealmate.meal.controller;

import com.mealmate.meal.model.CustomRecipe;
import com.mealmate.meal.service.CustomRecipeService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/meals/customrecipes")
@RequiredArgsConstructor
public class CustomRecipeController {

    private final CustomRecipeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomRecipe>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomRecipe>> create(@RequestBody CustomRecipe entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
