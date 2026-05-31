package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class RecipeSuggestionIngredientResponse {

    private Long foodId;

    private String foodName;

    private BigDecimal requiredQuantity;

    private String requiredUnit;

    private BigDecimal availableQuantity;

    private String availableUnit;

    private Boolean sufficientQuantity;

    private Boolean expiringSoon;

    private LocalDate nearestExpiryDate;
}
