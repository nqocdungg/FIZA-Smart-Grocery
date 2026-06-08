package com.mealmate.catalog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreservationMethodResponse {
    private Long id;
    private Long foodId;
    private String content;
    private String referenceSource;
}