package com.mealmate.catalog.controller;

import com.mealmate.catalog.service.FavoriteRecipeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
public class FavoriteRecipeController {

    private final FavoriteRecipeService favoriteRecipeService;

    public FavoriteRecipeController(FavoriteRecipeService favoriteRecipeService) {
        this.favoriteRecipeService = favoriteRecipeService;
    }

    @GetMapping("/favorites")
    public List<Long> getFavorites() {
        return favoriteRecipeService.getFavoriteRecipeIds();
    }

    @PostMapping("/{id}/favorite")
    public Map<String, Object> addFavorite(@PathVariable Long id) {
        boolean favorite = favoriteRecipeService.addFavorite(id);
        return Map.of("recipeId", id, "favorite", favorite);
    }

    @DeleteMapping("/{id}/favorite")
    public Map<String, Object> removeFavorite(@PathVariable Long id) {
        boolean favorite = favoriteRecipeService.removeFavorite(id);
        return Map.of("recipeId", id, "favorite", favorite);
    }
}
