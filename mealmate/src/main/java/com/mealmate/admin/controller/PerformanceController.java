package com.mealmate.admin.controller;

import com.mealmate.catalog.model.Food;
import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.RecipeRepository;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PerformanceController {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FoodRepository foodRepository;
    private final RecipeRepository recipeRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalUsers = userRepository.count();
        long totalFamilies = familyRepository.count();
        long totalFoods = foodRepository.count();
        long totalRecipes = recipeRepository.count();
        
        stats.put("totalUsers", totalUsers);
        stats.put("totalFamilies", totalFamilies);
        stats.put("totalFoods", totalFoods);
        stats.put("totalRecipes", totalRecipes);
        
        // Calculate food counts per category
        List<Category> categories = categoryRepository.findAll();
        List<Food> foods = foodRepository.findAll();
        
        List<Map<String, Object>> foodStatsList = new ArrayList<>();
        for (Category cat : categories) {
            long count = foods.stream()
                    .filter(f -> f.getCategoryId() != null && f.getCategoryId().equals(cat.getId()))
                    .count();
            if (count > 0) {
                Map<String, Object> catStat = new HashMap<>();
                catStat.put("name", cat.getName());
                catStat.put("value", count);
                foodStatsList.add(catStat);
            }
        }
        stats.put("foodStats", foodStatsList);
        
        // Return some mock user activity stats for chart
        List<Map<String, Object>> userActivity = new ArrayList<>();
        String[] days = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};
        int[] activeCounts = {40, 55, 60, 80, 75, 95, 110}; // Dynamic-looking mock data
        for (int i = 0; i < days.length; i++) {
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("name", days[i]);
            dayMap.put("users", activeCounts[i]);
            userActivity.add(dayMap);
        }
        stats.put("userActivity", userActivity);

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", stats));
    }
}
