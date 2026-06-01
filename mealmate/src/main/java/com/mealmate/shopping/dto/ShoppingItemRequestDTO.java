package com.mealmate.shopping.dto;

import lombok.Data;

@Data
public class ShoppingItemRequestDTO {
    private Long id;        // Có ID thì là Update, không có là Create mới
    private Long foodId;
    private Double quantity;
    private String unit;
    private Long assignedTo;
    private String note;
}