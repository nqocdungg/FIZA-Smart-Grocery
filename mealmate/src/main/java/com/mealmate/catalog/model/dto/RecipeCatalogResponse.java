package com.mealmate.catalog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCatalogResponse {

    private Long id;

    private String name;

    private String imageUrl;

    private String description;

    private String preferredMealTime;

    private Integer cookingTimeMinutes;

    private Integer servings;

    private Integer calories;

    private String difficulty;

    private String displayStatus;

    private boolean favorite;

    private List<String> ingredients;
}
