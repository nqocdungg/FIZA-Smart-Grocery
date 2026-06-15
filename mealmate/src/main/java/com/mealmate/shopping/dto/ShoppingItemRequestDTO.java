package com.mealmate.shopping.dto;

import lombok.Data;

@Data
public class ShoppingItemRequestDTO {
    private Long id; // Có ID thì là Update, không có là Create mới
    private Long foodId;
    private String customName;
    private Double quantity;
    private String unit;
    private Long assignedTo;
    private String assigneeName;
    private String note;
    private Boolean isPurchased;
}
