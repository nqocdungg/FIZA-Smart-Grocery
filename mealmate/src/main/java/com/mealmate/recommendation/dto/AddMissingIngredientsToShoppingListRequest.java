package com.mealmate.recommendation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AddMissingIngredientsToShoppingListRequest {

    @NotNull
    private Long familyId;

    @NotNull
    private Long userId;

    @NotNull
    private LocalDate date;

    private LocalDate plannedDate;

    private String note;
}
