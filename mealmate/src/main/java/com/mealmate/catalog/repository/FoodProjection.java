package com.mealmate.catalog.repository;

public interface FoodProjection {

    Long getId();

    Long getCategoryId();

    String getCategoryName();

    String getName();

    String getUnit();

    String getSynonyms();

    String getImageUrl();

    String getIconKey();

    Boolean getIsSystem();
}