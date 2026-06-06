package com.mealmate.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientAvailabilityDto {

    private Long foodId;

    private String name;

    private BigDecimal requiredQuantity;

    private BigDecimal availableQuantity;

    private String unit;
}
