package com.mealmate.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private Long familyId;

    private Long userId;

    private String mealType;

    private LocalDate date;

    private List<RecipeRecommendationResponse> recommendations;
}
