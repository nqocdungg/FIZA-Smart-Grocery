package com.mealmate.shopping.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ShoppingListRequestDTO {
    private Long familyId;
    private LocalDate plannedDate;
    private String note;
    private List<ShoppingItemRequestDTO> items;
}

