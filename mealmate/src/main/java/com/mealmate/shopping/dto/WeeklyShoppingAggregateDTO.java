package com.mealmate.shopping.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyShoppingAggregateDTO {
    private Long foodId;
    private String foodName;
    private String customName;
    private String categoryName;
    private String foodIcon;
    private Double totalQuantity;
    private String unit;
    private List<String> neededDays; // E.g., ["Thứ 2", "Thứ 3"]
    private Boolean isPurchased;
    private List<Long> itemIds;
}
