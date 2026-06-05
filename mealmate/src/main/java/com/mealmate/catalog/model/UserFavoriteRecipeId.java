package com.mealmate.catalog.model;

import java.io.Serializable;
import java.util.Objects;

/**
 * Khóa chính kép cho bảng user_favorite_recipes (user_id, recipe_id).
 */
public class UserFavoriteRecipeId implements Serializable {

    private Long userId;
    private Long recipeId;

    public UserFavoriteRecipeId() {
    }

    public UserFavoriteRecipeId(Long userId, Long recipeId) {
        this.userId = userId;
        this.recipeId = recipeId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getRecipeId() {
        return recipeId;
    }

    public void setRecipeId(Long recipeId) {
        this.recipeId = recipeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserFavoriteRecipeId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId) && Objects.equals(recipeId, that.recipeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, recipeId);
    }
}
