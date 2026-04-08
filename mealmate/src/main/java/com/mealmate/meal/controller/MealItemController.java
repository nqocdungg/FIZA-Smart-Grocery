package com.mealmate.meal.controller;

import com.mealmate.meal.model.MealItem;
import com.mealmate.meal.service.MealItemService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/meals/mealitems")
@RequiredArgsConstructor
public class MealItemController {

    private final MealItemService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MealItem>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MealItem>> create(@RequestBody MealItem entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
