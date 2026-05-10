package com.mealmate.catalog.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {

    @NotBlank(message = "name is required")
    private String name;

    private String iconKey;

    private String colorCode;
}