package com.mealmate.meal.controller;

import com.mealmate.meal.model.Meal;
import com.mealmate.meal.service.MealService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/meals/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Meal>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Meal>> create(@RequestBody Meal entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
