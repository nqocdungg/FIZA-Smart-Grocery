package com.mealmate.catalog.service;

import com.mealmate.catalog.model.UserFavoriteRecipe;
import com.mealmate.catalog.repository.RecipeRepository;
import com.mealmate.catalog.repository.UserFavoriteRecipeRepository;
import com.mealmate.user.model.User;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FavoriteRecipeService {

    private final UserFavoriteRecipeRepository favoriteRecipeRepository;
    private final RecipeRepository recipeRepository;

    public FavoriteRecipeService(
            UserFavoriteRecipeRepository favoriteRecipeRepository,
            RecipeRepository recipeRepository
    ) {
        this.favoriteRecipeRepository = favoriteRecipeRepository;
        this.recipeRepository = recipeRepository;
    }

    public List<Long> getFavoriteRecipeIds() {
        return favoriteRecipeRepository.findRecipeIdsByUserId(getCurrentUserOrThrow().getId());
    }

    @Transactional
    public boolean addFavorite(Long recipeId) {
        Long userId = getCurrentUserOrThrow().getId();

        if (!recipeRepository.existsById(recipeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found");
        }

        if (!favoriteRecipeRepository.existsByUserIdAndRecipeId(userId, recipeId)) {
            UserFavoriteRecipe favorite = new UserFavoriteRecipe();
            favorite.setUserId(userId);
            favorite.setRecipeId(recipeId);
            favoriteRecipeRepository.save(favorite);
        }

        return true;
    }

    @Transactional
    public boolean removeFavorite(Long recipeId) {
        Long userId = getCurrentUserOrThrow().getId();
        favoriteRecipeRepository.deleteByUserIdAndRecipeId(userId, recipeId);
        return false;
    }

    private User getCurrentUserOrThrow() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user is invalid");
    }
}
