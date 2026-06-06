package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MenuPlanDayDto {
    private LocalDate date;
    private List<MenuPlanMealDto> meals;
}
