package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MenuPlanMealDto {
    private String mealType;
    private List<MenuPlanRecipeDto> recipes;
}
