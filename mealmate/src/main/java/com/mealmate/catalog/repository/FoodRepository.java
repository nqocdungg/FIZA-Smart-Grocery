package com.mealmate.catalog.repository;

import com.mealmate.catalog.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByNameContainingIgnoreCase(String query);
    Optional<Food> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Food> findByCategoryId(Long categoryId);

    @Query(value = """
        SELECT
            f.id AS id,
            f.category_id AS categoryId,
            c.name AS categoryName,
            f.name AS name,
            f.unit AS unit,
            f.synonyms AS synonyms,
            f.image_url AS imageUrl,
            f.is_system AS isSystem
        FROM foods f
        LEFT JOIN categories c ON f.category_id = c.id
        ORDER BY f.name ASC
        """, nativeQuery = true)
    List<FoodProjection> findAllWithCategory();

    @Query(value = """
        SELECT
            f.id AS id,
            f.category_id AS categoryId,
            c.name AS categoryName,
            f.name AS name,
            f.unit AS unit,
            f.synonyms AS synonyms,
            f.image_url AS imageUrl,
            f.is_system AS isSystem
        FROM foods f
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE (:categoryId IS NULL OR f.category_id = :categoryId)
          AND (
                :keyword IS NULL
             OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(COALESCE(f.synonyms, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY f.name ASC
        LIMIT 50
        """, nativeQuery = true)
    List<FoodProjection> searchFoods(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId
    );
}
