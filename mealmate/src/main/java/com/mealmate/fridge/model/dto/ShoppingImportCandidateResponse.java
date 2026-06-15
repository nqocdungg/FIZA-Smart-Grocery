package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ShoppingImportCandidateResponse {

    private Long shoppingListItemId;

    private Long shoppingListId;

    private LocalDate plannedDate;

    private Long foodId;

    private String foodName;

    private String customName;

    private Long categoryId;

    private String categoryName;

    private String categoryIconKey;

    private String categoryColorCode;

    private BigDecimal quantity;

    private String unit;

    private String note;

    private java.time.LocalDateTime importedToFridgeAt;
}
