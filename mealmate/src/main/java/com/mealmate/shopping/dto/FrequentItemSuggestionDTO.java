package com.mealmate.shopping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrequentItemSuggestionDTO {
    private Long id;
    private String foodName;
    private String unit;
}
