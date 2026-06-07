package com.mealmate.catalog.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDetailResponse {

    private Long id;

    private String name;

    private String description;

    private String instructions;

    private String referenceLink;

    private String author;

    private String preferredMealTime;

    private Integer cookingTimeMinutes;

    private Integer servings;

    private Integer calories;

    private String difficulty;

    private String imageUrl;

    private boolean favorite;

    private List<RecipeIngredientDetailResponse> ingredients;
}
