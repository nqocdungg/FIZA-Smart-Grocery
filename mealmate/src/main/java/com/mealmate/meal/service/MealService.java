package com.mealmate.meal.service;

import com.mealmate.meal.model.Meal;
import com.mealmate.meal.repository.MealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MealService {

    private final MealRepository repository;

    public List<Meal> findAll() {
        return repository.findAll();
    }

    public Meal save(Meal entity) {
        return repository.save(entity);
    }
}
