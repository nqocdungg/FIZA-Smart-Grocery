package com.mealmate.shopping.controller;

import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.shopping.service.ShoppingListItemService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shoppings/shoppinglistitems")
@RequiredArgsConstructor
public class ShoppingListItemController {

    private final ShoppingListItemService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShoppingListItem>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShoppingListItem>> create(@RequestBody ShoppingListItem entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
