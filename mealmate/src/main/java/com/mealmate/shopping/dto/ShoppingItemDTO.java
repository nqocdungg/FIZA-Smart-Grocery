package com.mealmate.shopping.dto;

import lombok.Data;

@Data
public class ShoppingItemDTO {
    private Long id;
    private Long foodId;
    private String foodName;
    private String customName;
    private String categoryName;
    private String foodIcon;
    private String colorCode;
    private Double quantity;
    private String unit;
    private Long assignedTo;
    private String assigneeName;
    private Boolean isPurchased;
    private String note;
    private java.time.LocalDateTime importedToFridgeAt;
    private Long fridgeItemId;
}
