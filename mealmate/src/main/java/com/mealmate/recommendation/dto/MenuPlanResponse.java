package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MenuPlanResponse {
    private Long familyId;
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MenuPlanDayDto> days;
}
