package com.mealmate.catalog.service;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository repository;

    public List<Food> findAll() {
        return repository.findAll();
    }

    public Food save(Food entity) {
        return repository.save(entity);
    }
}
