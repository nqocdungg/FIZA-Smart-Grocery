package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MenuDraftResponse {
    private Long familyId;
    private Long userId;
    private String mode;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MenuDraftDayDto> days;
}
