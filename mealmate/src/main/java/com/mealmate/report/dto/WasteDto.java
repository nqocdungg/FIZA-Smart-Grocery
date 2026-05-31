package com.mealmate.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WasteDto {
    private Long expiredCount;
    private Double changePercent;
    private String note;
}
