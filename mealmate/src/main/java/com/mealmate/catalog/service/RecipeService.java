package com.mealmate.catalog.service;

import com.mealmate.catalog.model.Recipe;
import com.mealmate.catalog.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import com.mealmate.catalog.model.RecipeIngredient;
import com.mealmate.catalog.repository.RecipeIngredientRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository repository;
    private final RecipeIngredientRepository ingredientRepository;

    public List<Recipe> findAll() {
        return repository.findAll();
    }

    public Recipe findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));
    }

    @Transactional
    public Recipe save(Recipe entity) {
        return repository.save(entity);
    }

    @Transactional
    public Recipe update(Long id, Recipe request) {
        Recipe recipe = findById(id);
        recipe.setName(request.getName());
        recipe.setInstructions(request.getInstructions());
        recipe.setReferenceLink(request.getReferenceLink());
        recipe.setAuthor(request.getAuthor());
        recipe.setPreferredMealTime(request.getPreferredMealTime());
        recipe.setImageUrl(request.getImageUrl());
        return repository.save(recipe);
    }

    @Transactional
    public void delete(Long id) {
        Recipe recipe = findById(id);
        repository.delete(recipe);
    }

    public List<RecipeIngredient> findIngredientsByRecipeId(Long recipeId) {
        return ingredientRepository.findByRecipeId(recipeId);
    }

    @Transactional
    public List<RecipeIngredient> saveIngredients(Long recipeId, List<RecipeIngredient> ingredients) {
        Recipe recipe = findById(recipeId);
        ingredientRepository.deleteByRecipeId(recipeId);
        for (RecipeIngredient ing : ingredients) {
            ing.setRecipe(recipe);
        }
        return ingredientRepository.saveAll(ingredients);
    }
}
