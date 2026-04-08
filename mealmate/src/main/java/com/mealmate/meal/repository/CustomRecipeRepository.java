package com.mealmate.meal.repository;

import com.mealmate.meal.model.CustomRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomRecipeRepository extends JpaRepository<CustomRecipe, Long> {
}
