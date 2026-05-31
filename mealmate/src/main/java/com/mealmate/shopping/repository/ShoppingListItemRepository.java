package com.mealmate.shopping.repository;

import com.mealmate.shopping.model.ShoppingListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingListItemRepository extends JpaRepository<ShoppingListItem, Long> {

    interface DateCountProjection {
	LocalDate getDate();

	Long getCount();
    }

    interface CategoryCountProjection {
	Long getCategoryId();

	String getCategoryName();

	Long getCount();
    }

    @Query(value = """
	    select count(sli.id)
	    from shopping_list_items sli
	    join shopping_lists sl on sli.shopping_list_id = sl.id
	    join foods f on sli.food_id = f.id
	    where sl.family_id = :familyId
	      and sli.is_purchased = true
	      and sl.created_date between :from and :to
	      and (:categoryId is null or f.category_id = :categoryId)
	    """, nativeQuery = true)
    Long countPurchasedItems(
	    @Param("familyId") Long familyId,
	    @Param("from") LocalDate from,
	    @Param("to") LocalDate to,
	    @Param("categoryId") Long categoryId
    );

    @Query(value = """
	    select sl.created_date as date, count(sli.id) as count
	    from shopping_list_items sli
	    join shopping_lists sl on sli.shopping_list_id = sl.id
	    join foods f on sli.food_id = f.id
	    where sl.family_id = :familyId
	      and sli.is_purchased = true
	      and sl.created_date between :from and :to
	      and (:categoryId is null or f.category_id = :categoryId)
	    group by sl.created_date
	    order by sl.created_date
	    """, nativeQuery = true)
    List<DateCountProjection> countPurchasedItemsByDate(
	    @Param("familyId") Long familyId,
	    @Param("from") LocalDate from,
	    @Param("to") LocalDate to,
	    @Param("categoryId") Long categoryId
    );

    @Query(value = """
	    select c.id as categoryId, c.name as categoryName, count(sli.id) as count
	    from shopping_list_items sli
	    join shopping_lists sl on sli.shopping_list_id = sl.id
	    join foods f on sli.food_id = f.id
	    left join categories c on f.category_id = c.id
	    where sl.family_id = :familyId
	      and sli.is_purchased = true
	      and sl.created_date between :from and :to
	      and (:categoryId is null or c.id = :categoryId)
	    group by c.id, c.name
	    """, nativeQuery = true)
    List<CategoryCountProjection> countPurchasedItemsByCategory(
	    @Param("familyId") Long familyId,
	    @Param("from") LocalDate from,
	    @Param("to") LocalDate to,
	    @Param("categoryId") Long categoryId
    );

    @Query(value = """
        SELECT
            sli.id AS shoppingListItemId,
            sl.id AS shoppingListId,
            sl.planned_date AS plannedDate,
            f.id AS foodId,
            f.name AS foodName,
            sli.custom_name AS customName,
            f.category_id AS categoryId,
            c.name AS categoryName,
            c.icon_key AS categoryIconKey,
            c.color_code AS categoryColorCode,
            sli.quantity AS quantity,
            COALESCE(sli.unit, f.unit) AS unit,
            sli.note AS note
        FROM shopping_list_items sli
        JOIN shopping_lists sl ON sl.id = sli.shopping_list_id
        JOIN foods f ON f.id = sli.food_id
        LEFT JOIN categories c ON c.id = f.category_id
        WHERE sl.family_id = :familyId
          AND COALESCE(sli.is_purchased, false) = true
          AND sli.imported_to_fridge_at IS NULL
        ORDER BY
            CASE WHEN sl.planned_date IS NULL THEN 1 ELSE 0 END,
            sl.planned_date DESC,
            sli.order_number ASC,
            sli.id ASC
        """, nativeQuery = true)
    List<ShoppingImportCandidateProjection> findFridgeImportCandidates(@Param("familyId") Long familyId);

    @Query("""
        SELECT item
        FROM ShoppingListItem item
        JOIN FETCH item.shoppingList shoppingList
        JOIN FETCH item.food food
        WHERE item.id = :id
          AND shoppingList.family.id = :familyId
        """)
    Optional<ShoppingListItem> findImportableByIdAndFamilyId(
            @Param("id") Long id,
            @Param("familyId") Long familyId
    );
}
