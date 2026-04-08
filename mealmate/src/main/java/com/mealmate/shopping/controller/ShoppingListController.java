package com.mealmate.shopping.controller;

import com.mealmate.shopping.model.ShoppingList;
import com.mealmate.shopping.service.ShoppingListService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shoppings/shoppinglists")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShoppingList>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShoppingList>> create(@RequestBody ShoppingList entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
