package com.mealmate.fridge.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ImportShoppingItemRequest {

    @NotNull(message = "shoppingListItemId is required")
    private Long shoppingListItemId;

    @NotNull(message = "foodId is required")
    private Long foodId;

    private String customName;

    @NotNull(message = "quantity is required")
    @DecimalMin(value = "0.01", message = "quantity must be greater than 0")
    private BigDecimal quantity;

    @NotNull(message = "storageLocation is required")
    private String storageLocation;

    private String specificLocation;

    private LocalDate addedDate;

    @NotNull(message = "expiryDate is required")
    private LocalDate expiryDate;

    private String note;
}
