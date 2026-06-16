package com.mealmate.recommendation.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

@org.springframework.stereotype.Repository
public interface RecommendationRepository extends Repository<com.mealmate.catalog.model.Recipe, Long> {

    @Query(value = """
            select
                fi.food_id as foodId,
                COALESCE(min(fi.custom_name), f.name) as foodName,
                sum(fi.quantity) as availableQuantity,
                COALESCE(f.unit, 'kg') as unit,
                min(fi.expiry_date) as nearestExpiryDate
            from fridge_items fi
            left join foods f on f.id = fi.food_id
            where fi.family_id = :familyId
              and fi.status = 'STORED'
              and (fi.expiry_date is null or fi.expiry_date >= :forDate)
            group by fi.food_id, f.name, f.unit
            having sum(fi.quantity) > 0
            """, nativeQuery = true)
    List<FridgeStockProjection> findAvailableFridgeStocks(
            @Param("familyId") Long familyId,
            @Param("forDate") LocalDate forDate
    );

    @Query(value = """
            select distinct
                r.id as recipeId,
                r.name as recipeName,
                r.image_url as imageUrl,
                r.preferred_meal_time as preferredMealTime,
                r.difficulty as difficulty
            from recipes r
            join recipe_ingredients ri on ri.recipe_id = r.id
            where ri.food_id in :foodIds
            """, nativeQuery = true)
    List<RecipeCandidateProjection> findCandidateRecipesByFoodIds(@Param("foodIds") List<Long> foodIds);

        @Query(value = """
                        select
                                r.id as recipeId,
                                r.name as recipeName,
                                r.image_url as imageUrl,
                                r.preferred_meal_time as preferredMealTime,
                                r.difficulty as difficulty
                        from recipes r
                        order by r.id desc
                        limit :limit
                        """, nativeQuery = true)
        List<RecipeCandidateProjection> findTopRecipes(@Param("limit") int limit);

    @Query(value = """
            select
                ri.recipe_id as recipeId,
                ri.food_id as foodId,
                f.name as foodName,
                ri.quantity as requiredQuantity,
                coalesce(ri.unit, f.unit) as unit
            from recipe_ingredients ri
            join foods f on f.id = ri.food_id
            where ri.recipe_id in :recipeIds
            order by ri.recipe_id, ri.id
            """, nativeQuery = true)
    List<RecipeIngredientNeedProjection> findIngredientsByRecipeIds(@Param("recipeIds") List<Long> recipeIds);

    @Query(value = """
            select
                ufr.recipe_id as recipeId,
                count(distinct ufr.user_id) as favoriteCount
            from user_favorite_recipes ufr
            join users u on u.id = ufr.user_id
            where u.family_id = :familyId
              and ufr.recipe_id in :recipeIds
            group by ufr.recipe_id
            """, nativeQuery = true)
    List<FamilyFavoriteCountProjection> findFamilyFavoriteCounts(
            @Param("familyId") Long familyId,
            @Param("recipeIds") List<Long> recipeIds
    );

    @Query(value = """
            select
                mi.recipe_id as recipeId,
                max(me.meal_date) as latestMealDate
            from meal_items mi
            join meals me on me.id = mi.meal_id
            join menus mn on mn.id = me.menu_id
            where mn.family_id = :familyId
              and me.meal_date between :fromDate and :toDate
            group by mi.recipe_id
            """, nativeQuery = true)
    List<RecentRecipeProjection> findRecentRecipes(
            @Param("familyId") Long familyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query(value = """
            select
                me.meal_date as mealDate,
                me.meal_type as mealType,
                mi.id as mealItemId,
                r.id as recipeId,
                r.name as recipeName,
                r.image_url as imageUrl,
                mi.status as status
            from menus mn
            join meals me on me.menu_id = mn.id
            join meal_items mi on mi.meal_id = me.id
            join recipes r on r.id = mi.recipe_id
            where mn.family_id = :familyId
              and me.meal_date between :startDate and :endDate
            order by me.meal_date,
                case me.meal_type
                    when 'BREAKFAST' then 1
                    when 'LUNCH' then 2
                    when 'DINNER' then 3
                    else 4
                end,
                mi.id
            """, nativeQuery = true)
    List<MenuPlanItemProjection> findMenuPlanItems(
            @Param("familyId") Long familyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}