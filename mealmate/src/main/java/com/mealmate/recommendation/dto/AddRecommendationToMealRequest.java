package com.mealmate.recommendation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AddRecommendationToMealRequest {

    @NotNull
    private Long familyId;

    @NotBlank
    private String mealType;

    @NotNull
    private LocalDate date;

    private String status;
}
