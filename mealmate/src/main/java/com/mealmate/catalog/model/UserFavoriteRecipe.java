package com.mealmate.catalog.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Liên kết N-N giữa người dùng và món ăn yêu thích.
 */
@Entity
@Table(name = "user_favorite_recipes")
@IdClass(UserFavoriteRecipeId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserFavoriteRecipe {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "recipe_id")
    private Long recipeId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
