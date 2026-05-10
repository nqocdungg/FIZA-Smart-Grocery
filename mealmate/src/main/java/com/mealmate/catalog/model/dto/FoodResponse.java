package com.mealmate.catalog.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FoodResponse {

    private Long id;

    private Long categoryId;

    private String categoryName;

    private String name;

    private String unit;

    private String synonyms;

    private String imageUrl;

    private String iconKey;

    private Boolean isSystem;
}