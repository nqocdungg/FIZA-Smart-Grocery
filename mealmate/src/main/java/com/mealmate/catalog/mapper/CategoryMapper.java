package com.mealmate.catalog.mapper;

import com.mealmate.catalog.model.dto.CategoryRequest;
import com.mealmate.catalog.model.dto.CategoryResponse;
import com.mealmate.catalog.model.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        Category category = new Category();

        category.setName(normalizeBlank(request.getName()));
        category.setIconKey(normalizeBlank(request.getIconKey()));
        category.setColorCode(normalizeBlank(request.getColorCode()));

        return category;
    }

    public CategoryResponse toResponse(Category category) {
        CategoryResponse response = new CategoryResponse();

        response.setId(category.getId());
        response.setName(category.getName());
        response.setIconKey(category.getIconKey());
        response.setColorCode(category.getColorCode());

        return response;
    }

    public void updateEntity(Category category, CategoryRequest request) {
        category.setName(normalizeBlank(request.getName()));
        category.setIconKey(normalizeBlank(request.getIconKey()));
        category.setColorCode(normalizeBlank(request.getColorCode()));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}