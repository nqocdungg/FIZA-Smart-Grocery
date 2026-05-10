package com.mealmate.catalog.service;

import com.mealmate.catalog.model.dto.FoodRequest;
import com.mealmate.catalog.model.dto.FoodResponse;
import com.mealmate.catalog.mapper.FoodMapper;
import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final CategoryRepository categoryRepository;
    private final FoodMapper foodMapper;

    public FoodService(
            FoodRepository foodRepository,
            CategoryRepository categoryRepository,
            FoodMapper foodMapper
    ) {
        this.foodRepository = foodRepository;
        this.categoryRepository = categoryRepository;
        this.foodMapper = foodMapper;
    }

    public List<FoodResponse> getAll() {
        return foodRepository.findAllWithCategory()
                .stream()
                .map(foodMapper::toResponse)
                .toList();
    }

    public List<FoodResponse> search(String keyword, Long categoryId) {
        String normalizedKeyword = normalizeBlank(keyword);

        return foodRepository.searchFoods(normalizedKeyword, categoryId)
                .stream()
                .map(foodMapper::toResponse)
                .toList();
    }

    public FoodResponse getById(Long id) {
        Food food = getFoodOrThrow(id);
        return foodMapper.toResponse(food);
    }

    @Transactional
    public FoodResponse create(FoodRequest request) {
        validateFoodRequest(request);

        String name = normalizeBlank(request.getName());

        if (foodRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Food already exists");
        }

        request.setName(name);

        Food food = foodMapper.toEntity(request);
        Food saved = foodRepository.save(food);

        return foodMapper.toResponse(saved);
    }

    @Transactional
    public FoodResponse update(Long id, FoodRequest request) {
        Food food = getFoodOrThrow(id);

        validateFoodRequest(request);

        String name = normalizeBlank(request.getName());

        foodRepository.findByNameIgnoreCase(name)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("Food already exists");
                    }
                });

        request.setName(name);
        foodMapper.updateEntity(food, request);

        Food saved = foodRepository.save(food);
        return foodMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Food food = getFoodOrThrow(id);
        foodRepository.delete(food);
    }

    private Food getFoodOrThrow(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food not found"));
    }

    private void validateFoodRequest(FoodRequest request) {
        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("categoryId is required");
        }

        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new IllegalArgumentException("Category not found");
        }

        String name = normalizeBlank(request.getName());

        if (name == null) {
            throw new IllegalArgumentException("Food name is required");
        }
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}