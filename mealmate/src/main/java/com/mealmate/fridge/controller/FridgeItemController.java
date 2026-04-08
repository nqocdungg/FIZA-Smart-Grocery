package com.mealmate.fridge.controller;

import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.service.FridgeItemService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fridges/fridgeitems")
@RequiredArgsConstructor
public class FridgeItemController {

    private final FridgeItemService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FridgeItem>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FridgeItem>> create(@RequestBody FridgeItem entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }
}
