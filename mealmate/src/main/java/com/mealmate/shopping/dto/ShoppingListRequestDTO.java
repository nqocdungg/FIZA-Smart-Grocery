package com.mealmate.shopping.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class ShoppingListRequestDTO {
    private Long familyId;
    private LocalDate plannedDate;
    private String note;
    private List<ShoppingItemRequestDTO> items;
}
