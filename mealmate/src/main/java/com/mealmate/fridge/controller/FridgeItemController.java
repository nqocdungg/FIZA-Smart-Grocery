package com.mealmate.fridge.controller;

import com.mealmate.fridge.model.dto.CreateFridgeItemRequest;
import com.mealmate.fridge.model.dto.FridgeOverviewResponse;
import com.mealmate.fridge.model.dto.FridgeItemResponse;
import com.mealmate.fridge.model.dto.ImportShoppingItemsRequest;
import com.mealmate.fridge.model.dto.ImportShoppingItemsResponse;
import com.mealmate.fridge.model.dto.RecipeSuggestionResponse;
import com.mealmate.fridge.model.dto.RemoveFridgeItemRequest;
import com.mealmate.fridge.model.dto.ShoppingImportCandidateResponse;
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

    @GetMapping("/recipe-suggestions")
    public List<RecipeSuggestionResponse> getRecipeSuggestions(
            @RequestParam(defaultValue = "30") int limit
    ) {
        return fridgeItemService.getRecipeSuggestions(limit);
    }

    @GetMapping("/recipe-library")
    public List<RecipeSuggestionResponse> getRecipeLibrary(
            @RequestParam(defaultValue = "100") int limit
    ) {
        return fridgeItemService.getRecipeLibrary(limit);
    }

    @GetMapping("/import-candidates")
    public List<ShoppingImportCandidateResponse> getShoppingImportCandidates() {
        return fridgeItemService.getShoppingImportCandidates();
    }

    @PostMapping("/import-from-shopping")
    public ImportShoppingItemsResponse importFromShopping(
            @Valid @RequestBody ImportShoppingItemsRequest request
    ) {
        return fridgeItemService.importFromShopping(request);
    }
}
