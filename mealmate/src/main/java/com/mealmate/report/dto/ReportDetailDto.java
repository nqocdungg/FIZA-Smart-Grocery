package com.mealmate.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDetailDto {
    private List<ReportPointDto> purchaseSeries;
    private List<ReportPointDto> usedSeries;
    private List<ReportPointDto> expiredSeries;
}
