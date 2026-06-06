package com.mealmate.catalog.model.dto;

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
public class RecipeIngredientDetailResponse {

    private Long foodId;

    private String foodName;

    private Double quantity;

    private String unit;
}
