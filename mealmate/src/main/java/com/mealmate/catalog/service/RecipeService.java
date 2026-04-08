package com.mealmate.catalog.service;

import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository repository;

    public List<Recipe> findAll() {
        return repository.findAll();
    }

    public Recipe save(Recipe entity) {
        return repository.save(entity);
    }
}
