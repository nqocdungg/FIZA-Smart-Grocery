package com.mealmate.catalog.service;

import com.mealmate.catalog.model.RecipeIngredient;
import com.mealmate.catalog.repository.RecipeIngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeIngredientService {

    private final RecipeIngredientRepository repository;

    public List<RecipeIngredient> findAll() {
        return repository.findAll();
    }

    public RecipeIngredient save(RecipeIngredient entity) {
        return repository.save(entity);
    }
}
