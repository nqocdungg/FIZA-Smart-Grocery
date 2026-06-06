package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MenuPlanRecipeDto {
    private Long mealItemId;
    private Long recipeId;
    private String recipeName;
    private String imageUrl;
    private String status;
}
