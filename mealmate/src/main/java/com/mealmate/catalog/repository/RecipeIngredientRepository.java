package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    // 🎯 GIỮ NGUYÊN từ nhánh hihi: Phục vụ CRUD và xóa nguyên liệu theo món
    List<RecipeIngredient> findByRecipeId(Long recipeId);
    
    void deleteByRecipeId(Long recipeId);

    // 🎯 GIỮ NGUYÊN từ nhánh release/hieulq: Phục vụ thuật toán gợi ý món ăn thông minh
    @Query(value = """
        SELECT
            r.id AS recipeId,
            r.name AS recipeName,
            r.image_url AS imageUrl,
            r.instructions AS instructions,
            r.description AS description,
            r.cooking_time_minutes AS cookingTimeMinutes,
            r.servings AS servings,
            r.calories AS calories,
            r.difficulty AS difficulty,
            r.preferred_meal_time AS preferredMealTime,
            ri.food_id AS foodId,
            f.name AS foodName,
            ri.quantity AS requiredQuantity,
            COALESCE(ri.unit, f.unit) AS requiredUnit
        FROM recipes r
        JOIN recipe_ingredients ri ON ri.recipe_id = r.id
        JOIN foods f ON f.id = ri.food_id
        ORDER BY r.name ASC, ri.id ASC
        """, nativeQuery = true)
    List<RecipeSuggestionProjection> findRecipeSuggestionRows();
}