package com.mealmate.recommendation.controller;

import com.mealmate.recommendation.dto.AddMissingIngredientsToShoppingListRequest;
import com.mealmate.recommendation.dto.AddMissingIngredientsToShoppingListResponse;
import com.mealmate.recommendation.dto.AddRecommendationToMealRequest;
import com.mealmate.recommendation.dto.AddRecommendationToMealResponse;
import com.mealmate.recommendation.dto.DeleteMealItemResponse;
import com.mealmate.recommendation.dto.GenerateMenuDraftRequest;
import com.mealmate.recommendation.dto.MenuDraftResponse;
import com.mealmate.recommendation.dto.MenuPlanResponse;
import com.mealmate.recommendation.dto.RecommendationResponse;
import com.mealmate.recommendation.dto.UpdateMealItemRequest;
import com.mealmate.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/recipes")
    public ResponseEntity<RecommendationResponse> recommendRecipes(
            @RequestParam Long familyId,
            @RequestParam Long userId,
            @RequestParam String mealType,
            @RequestParam LocalDate date,
            @RequestParam(defaultValue = "5") Integer limit
    ) {
        return ResponseEntity.ok(recommendationService.recommendRecipes(familyId, userId, mealType, date, limit));
    }

    @GetMapping("/menu-plan")
    public ResponseEntity<MenuPlanResponse> getMenuPlan(
            @RequestParam Long familyId,
            @RequestParam Long userId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return ResponseEntity.ok(recommendationService.getMenuPlan(familyId, userId, startDate, endDate));
    }

    @PostMapping("/menu-draft")
    public ResponseEntity<MenuDraftResponse> generateMenuDraft(
            @Valid @RequestBody GenerateMenuDraftRequest request
    ) {
        return ResponseEntity.ok(recommendationService.generateMenuDraft(request));
    }

    @PostMapping("/{recipeId}/add-to-meal")
    public ResponseEntity<AddRecommendationToMealResponse> addRecommendationToMeal(
            @PathVariable Long recipeId,
            @Valid @RequestBody AddRecommendationToMealRequest request
    ) {
        return ResponseEntity.ok(recommendationService.addToMeal(recipeId, request));
    }

    @PatchMapping("/meal-items/{mealItemId}")
    public ResponseEntity<AddRecommendationToMealResponse> updateMealItem(
            @PathVariable Long mealItemId,
            @Valid @RequestBody UpdateMealItemRequest request
    ) {
        return ResponseEntity.ok(recommendationService.updateMealItem(mealItemId, request));
    }

    @DeleteMapping("/meal-items/{mealItemId}")
    public ResponseEntity<DeleteMealItemResponse> deleteMealItem(
            @PathVariable Long mealItemId,
            @RequestParam Long familyId,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(recommendationService.deleteMealItem(mealItemId, familyId, userId));
    }

    @PostMapping("/{recipeId}/missing-ingredients/add-to-shopping-list")
    public ResponseEntity<AddMissingIngredientsToShoppingListResponse> addMissingIngredientsToShoppingList(
            @PathVariable Long recipeId,
            @Valid @RequestBody AddMissingIngredientsToShoppingListRequest request
    ) {
        return ResponseEntity.ok(recommendationService.addMissingIngredientsToShoppingList(recipeId, request));
    }
}
