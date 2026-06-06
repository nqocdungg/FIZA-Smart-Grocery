package com.mealmate.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddRecommendationToMealResponse {

    private Long menuId;

    private Long mealId;

    private Long mealItemId;

    private String status;
}
