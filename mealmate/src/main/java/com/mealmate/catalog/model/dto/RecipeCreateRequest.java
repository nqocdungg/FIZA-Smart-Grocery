package com.mealmate.catalog.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class RecipeCreateRequest {

    @NotBlank
    private String name;

    private String description;

    private String instructions;

    private String referenceLink;

    private String author;

    private String imageUrl;

    private String preferredMealTime;

    @Positive
    private Integer cookingTimeMinutes;

    @Positive
    private Integer servings;

    @Positive
    private Integer calories;

    private String difficulty;

    @Valid
    private List<RecipeIngredientRequest> ingredients = new ArrayList<>();
}
