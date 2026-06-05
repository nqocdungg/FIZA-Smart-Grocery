package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByRecipeId(Long recipeId);

    void deleteByRecipeId(Long recipeId);

    @Query("""
            select ri.recipe.id as recipeId, ri.food.name as foodName
            from RecipeIngredient ri
            where ri.recipe.id in :recipeIds
            order by ri.recipe.id, ri.id
            """)
    List<RecipeIngredientSummaryProjection> findIngredientNamesByRecipeIds(@Param("recipeIds") List<Long> recipeIds);

    @Query("""
            select ri.food.id as foodId,
                   ri.food.name as foodName,
                   ri.quantity as quantity,
                   ri.unit as unit
            from RecipeIngredient ri
            where ri.recipe.id = :recipeId
            order by ri.id
            """)
    List<RecipeIngredientDetailProjection> findIngredientDetailsByRecipeId(@Param("recipeId") Long recipeId);

    @Query(value = """
        SELECT
            r.id AS recipeId,
            r.name AS recipeName,
            r.image_url AS imageUrl,
            r.instructions AS instructions,
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
