package com.mealmate.catalog.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryResponse {

    private Long id;

    private String name;

    private String iconKey;

    private String colorCode;
}