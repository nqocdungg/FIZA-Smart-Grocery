package com.mealmate.meal.service;

import com.mealmate.meal.model.MealItem;
import com.mealmate.meal.repository.MealItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MealItemService {

    private final MealItemRepository repository;

    public List<MealItem> findAll() {
        return repository.findAll();
    }

    public MealItem save(MealItem entity) {
        return repository.save(entity);
    }
}
