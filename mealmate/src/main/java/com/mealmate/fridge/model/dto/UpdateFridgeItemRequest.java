package com.mealmate.fridge.model.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UpdateFridgeItemRequest {

    private Long foodId;

    private String customName;

    @DecimalMin(value = "0.01", message = "quantity must be greater than 0")
    private BigDecimal quantity;

    private String storageLocation;

    private String specificLocation;

    private LocalDate addedDate;

    private LocalDate expiryDate;

    private String imageUrl;

    private String note;

    private String unit;
}
