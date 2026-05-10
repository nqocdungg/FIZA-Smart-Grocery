package com.mealmate.catalog.mapper;

import com.mealmate.catalog.model.dto.FoodRequest;
import com.mealmate.catalog.model.dto.FoodResponse;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.FoodProjection;
import org.springframework.stereotype.Component;

@Component
public class FoodMapper {

    public Food toEntity(FoodRequest request) {
        Food food = new Food();

        food.setCategoryId(request.getCategoryId());
        food.setName(normalizeBlank(request.getName()));
        food.setUnit(normalizeBlank(request.getUnit()));
        food.setSynonyms(normalizeBlank(request.getSynonyms()));
        food.setImageUrl(normalizeBlank(request.getImageUrl()));
        food.setIconKey(normalizeBlank(request.getIconKey()));
        food.setIsSystem(true);

        return food;
    }

    public FoodResponse toResponse(Food food) {
        FoodResponse response = new FoodResponse();

        response.setId(food.getId());
        response.setCategoryId(food.getCategoryId());
        response.setName(food.getName());
        response.setUnit(food.getUnit());
        response.setSynonyms(food.getSynonyms());
        response.setImageUrl(food.getImageUrl());
        response.setIconKey(food.getIconKey());
        response.setIsSystem(food.getIsSystem());

        return response;
    }

    public FoodResponse toResponse(FoodProjection projection) {
        FoodResponse response = new FoodResponse();

        response.setId(projection.getId());
        response.setCategoryId(projection.getCategoryId());
        response.setCategoryName(projection.getCategoryName());
        response.setName(projection.getName());
        response.setUnit(projection.getUnit());
        response.setSynonyms(projection.getSynonyms());
        response.setImageUrl(projection.getImageUrl());
        response.setIconKey(projection.getIconKey());
        response.setIsSystem(projection.getIsSystem());

        return response;
    }

    public void updateEntity(Food food, FoodRequest request) {
        food.setCategoryId(request.getCategoryId());
        food.setName(normalizeBlank(request.getName()));
        food.setUnit(normalizeBlank(request.getUnit()));
        food.setSynonyms(normalizeBlank(request.getSynonyms()));
        food.setImageUrl(normalizeBlank(request.getImageUrl()));
        food.setIconKey(normalizeBlank(request.getIconKey()));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}