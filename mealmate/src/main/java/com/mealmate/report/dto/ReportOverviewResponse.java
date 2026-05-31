package com.mealmate.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportOverviewResponse {
    private LocalDate from;
    private LocalDate to;
    private ReportSummaryDto summary;
    private ReportTrendDto trend;
    private WasteDto waste;
    private ReportDetailDto detail;
}
