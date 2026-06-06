package com.mealmate.catalog.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecipeIngredientRequest {

    @NotNull
    private Long foodId;

    @NotNull
    @Positive
    private Double quantity;

    private String unit;
}
