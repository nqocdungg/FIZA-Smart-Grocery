package com.mealmate.fridge.controller;

import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeOverviewResponse;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.model.dto.RemoveFridgeItemRequest;
import com.mealmate.fridge.model.dto.UpdateFridgeItemRequest;
import com.mealmate.fridge.service.FridgeItemService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fridge-items")
public class FridgeItemController {

    private final FridgeItemService fridgeItemService;

    public FridgeItemController(FridgeItemService fridgeItemService) {
        this.fridgeItemService = fridgeItemService;
    }

    @GetMapping
    public List<FridgeItemResponse> getStoredItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId
    ) {
        if ((keyword == null || keyword.trim().isEmpty()) && categoryId == null) {
            return fridgeItemService.getStoredItems();
        }

        return fridgeItemService.searchStoredItems(keyword, categoryId);
    }

    @PostMapping
    public FridgeItemResponse create(
            @Valid @RequestBody CreateFridgeItemRequest request
    ) {
        return fridgeItemService.create(request);
    }

    @PatchMapping("/{id}")
    public FridgeItemResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFridgeItemRequest request
    ) {
        return fridgeItemService.update(id, request);
    }

    @PatchMapping("/{id}/remove")
    public FridgeItemResponse remove(
            @PathVariable Long id,
            @Valid @RequestBody RemoveFridgeItemRequest request
    ) {
        return fridgeItemService.remove(id, request);
    }

    @GetMapping("/count")
    public long countStoredItems() {
        return fridgeItemService.countStoredItems();
    }

    @GetMapping("/overview")
    public FridgeOverviewResponse getOverview() {
        return fridgeItemService.getOverview();
    }
}
