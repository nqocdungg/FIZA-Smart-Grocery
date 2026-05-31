package com.mealmate.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendItemDto {
    private Long categoryId;
    private String label;
    private Long count;
    private Double percent;
    private String color;
}
