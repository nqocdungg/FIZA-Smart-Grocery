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

    private String description;

    private String instructions;

    private String referenceLink;

    private String author;

    private Integer cookingTimeMinutes;

    private Integer servings;

    private Integer calories;

    private String difficulty;

    private String preferredMealTime;

    private int ingredientCount;

    private int score;

    private int coveragePercent;

    private Boolean canCook;

    private Boolean favorite;

    private List<RecipeSuggestionIngredientResponse> matchedIngredients;

    private List<RecipeSuggestionIngredientResponse> missingIngredients;

    private List<RecipeSuggestionIngredientResponse> expiringIngredients;
}
