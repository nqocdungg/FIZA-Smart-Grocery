package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query(value = "select recipe_id from user_favorite_recipes where user_id = :userId", nativeQuery = true)
    List<Long> findFavoriteRecipeIds(@Param("userId") Long userId);

    @Modifying
    @Query(
            value = """
                    insert into user_favorite_recipes (user_id, recipe_id)
                    values (:userId, :recipeId)
                    on conflict (user_id, recipe_id) do nothing
                    """,
            nativeQuery = true
    )
    void addFavoriteRecipe(@Param("userId") Long userId, @Param("recipeId") Long recipeId);

    @Modifying
    @Query(
            value = "delete from user_favorite_recipes where user_id = :userId and recipe_id = :recipeId",
            nativeQuery = true
    )
    void removeFavoriteRecipe(@Param("userId") Long userId, @Param("recipeId") Long recipeId);
}
