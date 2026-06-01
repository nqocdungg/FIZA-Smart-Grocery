package com.mealmate.shopping.dto;

import lombok.Data;

@Data
public class ShoppingItemDTO {
    private Long id;
    private String foodName;
    private String categoryName;
    private String foodIcon;
    private Double quantity;
    private String unit;
    private String assigneeName;
    private Boolean isPurchased;
}
