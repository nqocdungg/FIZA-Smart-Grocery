package com.mealmate.catalog.service;

import com.mealmate.catalog.model.dto.CategoryRequest;
import com.mealmate.catalog.model.dto.CategoryResponse;
import com.mealmate.catalog.mapper.CategoryMapper;
import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.repository.CategoryRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(
            CategoryRepository categoryRepository,
            CategoryMapper categoryMapper
    ) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    public CategoryResponse getById(Long id) {
        Category category = getCategoryOrThrow(id);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = normalizeBlank(request.getName());

        if (name == null) {
            throw new IllegalArgumentException("Category name is required");
        }

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category already exists");
        }

        request.setName(name);

        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);

        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getCategoryOrThrow(id);

        String name = normalizeBlank(request.getName());

        if (name == null) {
            throw new IllegalArgumentException("Category name is required");
        }

        categoryRepository.findByNameIgnoreCase(name)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("Category already exists");
                    }
                });

        request.setName(name);
        categoryMapper.updateEntity(category, request);

        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Category category = getCategoryOrThrow(id);
        categoryRepository.delete(category);
    }

    private Category getCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}