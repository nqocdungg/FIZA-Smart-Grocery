package com.mealmate.meal.repository;

import com.mealmate.meal.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    Optional<Meal> findByMenu_IdAndMealDateAndMealType(Long menuId, LocalDate mealDate, String mealType);
}
