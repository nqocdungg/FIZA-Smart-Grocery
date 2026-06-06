package com.mealmate.recommendation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GenerateMenuDraftRequest {

    @NotNull
    private Long familyId;

    @NotNull
    private Long userId;

    @NotNull
    private LocalDate startDate;

    private String mode;

    private Integer candidateLimit;
}
