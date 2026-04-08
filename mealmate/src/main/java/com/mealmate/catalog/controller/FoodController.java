package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.service.FoodService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Food>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Food>> create(@RequestBody Food entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
