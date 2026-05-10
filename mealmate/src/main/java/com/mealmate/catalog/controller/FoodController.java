package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.dto.FoodRequest;
import com.mealmate.catalog.model.dto.FoodResponse;
import com.mealmate.catalog.service.FoodService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(
            FoodService foodService
    ) {
        this.foodService = foodService;
    }

    @GetMapping
    public List<FoodResponse> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId
    ) {
        if (keyword != null || categoryId != null) {
            return foodService.search(keyword, categoryId);
        }

        return foodService.getAll();
    }

    @GetMapping("/{id}")
    public FoodResponse getById(
            @PathVariable Long id
    ) {
        return foodService.getById(id);
    }

    @PostMapping
    public FoodResponse create(
            @Valid @RequestBody FoodRequest request
    ) {
        return foodService.create(request);
    }

    @PutMapping("/{id}")
    public FoodResponse update(
            @PathVariable Long id,
            @Valid @RequestBody FoodRequest request
    ) {
        return foodService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        foodService.delete(id);
    }
}