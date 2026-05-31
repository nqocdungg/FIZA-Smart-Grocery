package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecipeSuggestionResponse {

    private Long recipeId;

    private String name;

    private String imageUrl;

    private String instructions;

    private String preferredMealTime;

    private int score;

    private int coveragePercent;

    private Boolean canCook;

    private List<RecipeSuggestionIngredientResponse> matchedIngredients;

    private List<RecipeSuggestionIngredientResponse> missingIngredients;

    private List<RecipeSuggestionIngredientResponse> expiringIngredients;
}
