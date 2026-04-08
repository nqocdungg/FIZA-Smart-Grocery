package com.mealmate.meal.service;

import com.mealmate.meal.model.CustomRecipe;
import com.mealmate.meal.repository.CustomRecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomRecipeService {

    private final CustomRecipeRepository repository;

    public List<CustomRecipe> findAll() {
        return repository.findAll();
    }

    public CustomRecipe save(CustomRecipe entity) {
        return repository.save(entity);
    }
}
