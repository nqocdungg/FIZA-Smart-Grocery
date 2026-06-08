package com.mealmate.recommendation.service;

import com.mealmate.catalog.repository.FoodRepository;
import com.mealmate.catalog.repository.RecipeRepository;
import com.mealmate.meal.repository.MealItemRepository;
import com.mealmate.meal.repository.MealRepository;
import com.mealmate.meal.repository.MenuRepository;
import com.mealmate.recommendation.config.RecommendationScoringProperties;
import com.mealmate.recommendation.dto.RecipeRecommendationResponse;
import com.mealmate.recommendation.dto.RecommendationResponse;
import com.mealmate.recommendation.repository.FamilyFavoriteCountProjection;
import com.mealmate.recommendation.repository.FridgeStockProjection;
import com.mealmate.recommendation.repository.RecentRecipeProjection;
import com.mealmate.recommendation.repository.RecipeCandidateProjection;
import com.mealmate.recommendation.repository.RecipeIngredientNeedProjection;
import com.mealmate.recommendation.repository.RecommendationRepository;
import com.mealmate.shopping.repository.ShoppingListItemRepository;
import com.mealmate.shopping.repository.ShoppingListRepository;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private RecommendationRepository recommendationRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private FoodRepository foodRepository;
    @Mock
    private MenuRepository menuRepository;
    @Mock
    private MealRepository mealRepository;
    @Mock
    private MealItemRepository mealItemRepository;
    @Mock
    private ShoppingListRepository shoppingListRepository;
    @Mock
    private ShoppingListItemRepository shoppingListItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Spy
    private RecommendationScoringProperties scoringProperties = new RecommendationScoringProperties();

    @InjectMocks
    private RecommendationService recommendationService;

    private final LocalDate targetDate = LocalDate.of(2026, 5, 27);

    @BeforeEach
    void setUp() {
        Family family = new Family();
        family.setId(1L);

        User user = User.builder().id(2L).email("user@test.com").passwordHash("x").fullName("Tester").build();
        user.setFamily(family);

        when(familyRepository.findById(1L)).thenReturn(Optional.of(family));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        lenient().when(recommendationRepository.findRecentRecipes(any(), any(), any())).thenReturn(List.of());
        lenient().when(recommendationRepository.findFamilyFavoriteCounts(any(), anyList())).thenReturn(List.of());
    }

    @Test
    void case1_fullIngredientMatch() {
        mockSingleRecipe("DINNER");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Thit bo", 300, "g"),
                ingredient(10L, 2L, "Rau cai", 200, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Thit bo", 500, "g", targetDate.plusDays(10)),
                stock(2L, "Rau cai", 250, "g", targetDate.plusDays(4))
        ));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getMatchPercent()).isEqualTo(100);
        assertThat(recipe.getMissingIngredients()).isEmpty();
        assertThat(recipe.getAvailableIngredients()).hasSize(2);
    }

    @Test
    void case2_missingOneIngredient() {
        mockSingleRecipe("DINNER");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Thit bo", 300, "g"),
                ingredient(10L, 2L, "Toi", 20, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Thit bo", 500, "g", targetDate.plusDays(10))
        ));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getMatchPercent()).isEqualTo(50);
        assertThat(recipe.getMissingIngredients()).hasSize(1);
        assertThat(recipe.getScore()).isLessThan(40);
    }

    @Test
    void case3_expiryPriorityApplied() {
        mockSingleRecipe("DINNER");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Ca chua", 100, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Ca chua", 200, "g", targetDate.plusDays(1))
        ));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getScore()).isGreaterThanOrEqualTo(85);
        assertThat(recipe.getReasons()).anyMatch(r -> r.contains("sap het han"));
    }

    @Test
    void case4_mealTypeMismatchPenalty() {
        mockSingleRecipe("LUNCH");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Ca hoi", 100, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Ca hoi", 200, "g", targetDate.plusDays(10))
        ));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getScore()).isEqualTo(30);
        assertThat(recipe.getReasons()).anyMatch(r -> r.contains("Khong phai bua uu tien"));
    }

    @Test
    void case5_recentRecipePenalty() {
        mockSingleRecipe("DINNER");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Thit ga", 200, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Thit ga", 300, "g", targetDate.plusDays(10))
        ));
        when(recommendationRepository.findRecentRecipes(any(), any(), any())).thenReturn(List.of(
                recent(10L, targetDate.minusDays(1))
        ));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getScore()).isEqualTo(40);
        assertThat(recipe.getReasons()).anyMatch(r -> r.contains("xuat hien gan day"));
    }

    @Test
    void case6_favoriteRecipeBonus() {
        mockSingleRecipe("DINNER");
        when(recommendationRepository.findIngredientsByRecipeIds(anyList())).thenReturn(List.of(
                ingredient(10L, 1L, "Thit ga", 200, "g")
        ));
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of(
                stock(1L, "Thit ga", 300, "g", targetDate.plusDays(10))
        ));
        when(recommendationRepository.findFamilyFavoriteCounts(any(), anyList())).thenReturn(List.of(favoriteCount(10L, 2L)));

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        RecipeRecommendationResponse recipe = response.getRecommendations().getFirst();

        assertThat(recipe.getScore()).isEqualTo(90);
        assertThat(recipe.getReasons()).anyMatch(r -> r.contains("yeu thich"));
    }

    @Test
    void case7_usedOrExpiredItemsNotCounted() {
        when(recommendationRepository.findAvailableFridgeStocks(1L, targetDate)).thenReturn(List.of());

        RecommendationResponse response = recommendationService.recommendRecipes(1L, 2L, "DINNER", targetDate, 5);
        assertThat(response.getRecommendations()).isEmpty();
    }

    private void mockSingleRecipe(String preferredMealTime) {
        when(recommendationRepository.findCandidateRecipesByFoodIds(anyList())).thenReturn(List.of(
                recipe(10L, "Mon test", preferredMealTime)
        ));
    }

    private RecipeCandidateProjection recipe(Long id, String name, String mealTime) {
        return new RecipeCandidateProjection() {
            @Override
            public Long getRecipeId() {
                return id;
            }

            @Override
            public String getRecipeName() {
                return name;
            }

            @Override
            public String getImageUrl() {
                return null;
            }

            @Override
            public String getPreferredMealTime() {
                return mealTime;
            }

            @Override
            public String getDifficulty() {
                return "EASY";
            }
        };
    }

    private RecipeIngredientNeedProjection ingredient(Long recipeId, Long foodId, String name, double qty, String unit) {
        return new RecipeIngredientNeedProjection() {
            @Override
            public Long getRecipeId() {
                return recipeId;
            }

            @Override
            public Long getFoodId() {
                return foodId;
            }

            @Override
            public String getFoodName() {
                return name;
            }

            @Override
            public BigDecimal getRequiredQuantity() {
                return BigDecimal.valueOf(qty);
            }

            @Override
            public String getUnit() {
                return unit;
            }
        };
    }

    private FridgeStockProjection stock(Long foodId, String name, double qty, String unit, LocalDate expiry) {
        return new FridgeStockProjection() {
            @Override
            public Long getFoodId() {
                return foodId;
            }

            @Override
            public String getFoodName() {
                return name;
            }

            @Override
            public BigDecimal getAvailableQuantity() {
                return BigDecimal.valueOf(qty);
            }

            @Override
            public String getUnit() {
                return unit;
            }

            @Override
            public LocalDate getNearestExpiryDate() {
                return expiry;
            }
        };
    }

    private RecentRecipeProjection recent(Long recipeId, LocalDate mealDate) {
        return new RecentRecipeProjection() {
            @Override
            public Long getRecipeId() {
                return recipeId;
            }

            @Override
            public LocalDate getLatestMealDate() {
                return mealDate;
            }
        };
    }

    private FamilyFavoriteCountProjection favoriteCount(Long recipeId, Long count) {
        return new FamilyFavoriteCountProjection() {
            @Override
            public Long getRecipeId() {
                return recipeId;
            }

            @Override
            public Long getFavoriteCount() {
                return count;
            }
        };
    }

}
