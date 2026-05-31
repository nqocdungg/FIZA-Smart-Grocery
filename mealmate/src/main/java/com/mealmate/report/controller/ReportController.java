package com.mealmate.report.controller;

import com.mealmate.common.dto.ApiResponse;
import com.mealmate.report.dto.ReportOverviewResponse;
import com.mealmate.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<ReportOverviewResponse>> getOverview(
            @RequestParam(required = false) Long familyId,
            @RequestParam(required = false) Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long categoryId
    ) {
        ReportOverviewResponse response = reportService.getOverview(familyId, userId, from, to, categoryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", response));
    }
}
