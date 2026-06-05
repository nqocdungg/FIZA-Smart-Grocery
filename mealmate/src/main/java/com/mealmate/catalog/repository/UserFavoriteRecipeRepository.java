package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.UserFavoriteRecipe;
import com.mealmate.catalog.model.UserFavoriteRecipeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteRecipeRepository extends JpaRepository<UserFavoriteRecipe, UserFavoriteRecipeId> {

    List<UserFavoriteRecipe> findByUserId(Long userId);

    boolean existsByUserIdAndRecipeId(Long userId, Long recipeId);

    void deleteByUserIdAndRecipeId(Long userId, Long recipeId);

    @Query("SELECT ufr.recipeId FROM UserFavoriteRecipe ufr WHERE ufr.userId = :userId")
    List<Long> findRecipeIdsByUserId(@Param("userId") Long userId);
}
