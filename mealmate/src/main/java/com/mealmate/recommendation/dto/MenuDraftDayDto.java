package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MenuDraftDayDto {
    private LocalDate date;
    private List<MenuDraftMealDto> meals;
}
