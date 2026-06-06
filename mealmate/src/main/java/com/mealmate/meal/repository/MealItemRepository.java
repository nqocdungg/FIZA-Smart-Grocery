package com.mealmate.meal.repository;

import com.mealmate.meal.model.MealItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MealItemRepository extends JpaRepository<MealItem, Long> {

    Optional<MealItem> findByMeal_IdAndRecipe_Id(Long mealId, Long recipeId);
}
