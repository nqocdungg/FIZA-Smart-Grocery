package com.mealmate.fridge.repository;

import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface FridgeItemRepository extends JpaRepository<FridgeItem, Long> {

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
        SELECT 
            fi.id AS id,
            fi.family_id AS familyId,
            fi.food_id AS foodId,
            f.name AS standardFoodName,
            fi.custom_name AS customName,
            COALESCE(fi.custom_name, f.name) AS displayName,
            COALESCE(fi.unit, f.unit) AS unit,
            f.category_id AS categoryId,
            c.name AS categoryName,
            c.icon_key AS categoryIconKey,
            c.color_code AS categoryColorCode,
            pm.preservation_method_contents AS preservationMethodContents,
            fi.quantity AS quantity,
            fi.storage_location AS storageLocation,
            fi.specific_location AS specificLocation,
            fi.added_date AS addedDate,
            fi.expiry_date AS expiryDate,
            fi.status AS status,
            fi.image_url AS imageUrl,
            fi.note AS note,
            fi.removed_reason AS removedReason,
            fi.removed_reason_note AS removedReasonNote,
            fi.removed_at AS removedAt,
            fi.removed_by AS removedBy,
            fi.created_at AS createdAt,
            fi.updated_at AS updatedAt
        FROM fridge_items fi
        JOIN foods f ON fi.food_id = f.id
        LEFT JOIN categories c ON f.category_id = c.id
        LEFT JOIN LATERAL (
            SELECT string_agg(content, '||' ORDER BY id) AS preservation_method_contents
            FROM preservation_methods
            WHERE food_id = f.id
        ) pm ON true
        WHERE fi.family_id = :familyId
          AND fi.status = :status
        ORDER BY 
            CASE WHEN fi.expiry_date IS NULL THEN 1 ELSE 0 END,
            fi.expiry_date ASC,
            fi.created_at DESC
        """, nativeQuery = true)
    List<FridgeItemProjection> findByFamilyIdAndStatusWithFoodName(
            @Param("familyId") Long familyId,
            @Param("status") String status
    );

    @Query(value = """
        SELECT 
            fi.id AS id,
            fi.family_id AS familyId,
            fi.food_id AS foodId,
            f.name AS standardFoodName,
            fi.custom_name AS customName,
            COALESCE(fi.custom_name, f.name) AS displayName,
            COALESCE(fi.unit, f.unit) AS unit,
            f.category_id AS categoryId,
            c.name AS categoryName,
            c.icon_key AS categoryIconKey,
            c.color_code AS categoryColorCode,
            pm.preservation_method_contents AS preservationMethodContents,
            fi.quantity AS quantity,
            fi.storage_location AS storageLocation,
            fi.specific_location AS specificLocation,
            fi.added_date AS addedDate,
            fi.expiry_date AS expiryDate,
            fi.status AS status,
            fi.image_url AS imageUrl,
            fi.note AS note,
            fi.removed_reason AS removedReason,
            fi.removed_reason_note AS removedReasonNote,
            fi.removed_at AS removedAt,
            fi.removed_by AS removedBy,
            fi.created_at AS createdAt,
            fi.updated_at AS updatedAt
        FROM fridge_items fi
        JOIN foods f ON fi.food_id = f.id
        LEFT JOIN categories c ON f.category_id = c.id
        LEFT JOIN LATERAL (
            SELECT string_agg(content, '||' ORDER BY id) AS preservation_method_contents
            FROM preservation_methods
            WHERE food_id = f.id
        ) pm ON true
        WHERE fi.family_id = :familyId
          AND fi.status = :status
          AND (:categoryId IS NULL OR f.category_id = :categoryId)
          AND (
                :keyword IS NULL
             OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(COALESCE(f.synonyms, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(COALESCE(fi.custom_name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY 
            CASE WHEN fi.expiry_date IS NULL THEN 1 ELSE 0 END,
            fi.expiry_date ASC,
            fi.created_at DESC
        """, nativeQuery = true)
    List<FridgeItemProjection> searchStoredItems(
            @Param("familyId") Long familyId,
            @Param("status") String status,
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId
    );

    @Query(value = """
        SELECT
            fi.id AS id,
            fi.family_id AS familyId,
            fi.food_id AS foodId,
            f.name AS standardFoodName,
            fi.custom_name AS customName,
            COALESCE(fi.custom_name, f.name) AS displayName,
            COALESCE(fi.unit, f.unit) AS unit,
            f.category_id AS categoryId,
            c.name AS categoryName,
            c.icon_key AS categoryIconKey,
            c.color_code AS categoryColorCode,
            pm.preservation_method_contents AS preservationMethodContents,
            fi.quantity AS quantity,
            fi.storage_location AS storageLocation,
            fi.specific_location AS specificLocation,
            fi.added_date AS addedDate,
            fi.expiry_date AS expiryDate,
            fi.status AS status,
            fi.image_url AS imageUrl,
            fi.note AS note,
            fi.removed_reason AS removedReason,
            fi.removed_reason_note AS removedReasonNote,
            fi.removed_at AS removedAt,
            fi.removed_by AS removedBy,
            fi.created_at AS createdAt,
            fi.updated_at AS updatedAt
        FROM fridge_items fi
        JOIN foods f ON fi.food_id = f.id
        LEFT JOIN categories c ON f.category_id = c.id
        LEFT JOIN LATERAL (
            SELECT string_agg(content, '||' ORDER BY id) AS preservation_method_contents
            FROM preservation_methods
            WHERE food_id = f.id
        ) pm ON true
        WHERE fi.id = :id
        """, nativeQuery = true)
    java.util.Optional<FridgeItemProjection> findDetailedById(@Param("id") Long id);

    List<FridgeItem> findByFamilyIdAndStatus(Long familyId, String status);

    long countByFamilyIdAndStatus(Long familyId, String status);

    default long countStoredByFamilyId(Long familyId) {
        return countByFamilyIdAndStatus(familyId, FridgeItemStatus.STORED);
    }

    @Query(value = """
        select count(fi.id)
        from fridge_items fi
        join foods f on fi.food_id = f.id
        where fi.family_id = :familyId
          and fi.added_date between :from and :to
          and (:categoryId is null or f.category_id = :categoryId)
        """, nativeQuery = true)
    Long countItemsAddedToFridge(
        @Param("familyId") Long familyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") Long categoryId
    );

    @Query(value = """
        select fi.added_date as date, count(fi.id) as count
        from fridge_items fi
        join foods f on fi.food_id = f.id
        where fi.family_id = :familyId
          and fi.added_date between :from and :to
          and (:categoryId is null or f.category_id = :categoryId)
        group by fi.added_date
        order by fi.added_date
        """, nativeQuery = true)
    List<DateCountProjection> countItemsAddedToFridgeByDate(
        @Param("familyId") Long familyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") Long categoryId
    );

    @Query(value = """
        select c.id as categoryId, c.name as categoryName, count(fi.id) as count
        from fridge_items fi
        join foods f on fi.food_id = f.id
        left join categories c on f.category_id = c.id
        where fi.family_id = :familyId
          and (
            (:status = 'USED'
              and (fi.status = 'USED' or fi.removed_reason = 'USED_UP')
              and coalesce(fi.removed_at, fi.updated_at) >= :from
              and coalesce(fi.removed_at, fi.updated_at) < :to
            )
            or
            (:status <> 'USED'
              and fi.status = :status
              and fi.updated_at >= :from
              and fi.updated_at < :to
            )
          )
          and (:categoryId is null or c.id = :categoryId)
        group by c.id, c.name
        """, nativeQuery = true)
    List<CategoryCountProjection> countByStatusAndUpdatedAtByCategory(
        @Param("familyId") Long familyId,
        @Param("status") String status,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("categoryId") Long categoryId
    );

    @Query(value = """
        select count(fi.id)
        from fridge_items fi
        join foods f on fi.food_id = f.id
        where fi.family_id = :familyId
          and fi.expiry_date between :from and :to
          and (
            (:status = 'EXPIRED'
              and (
                fi.status = 'EXPIRED'
                or fi.removed_reason in ('EXPIRED_DISCARDED', 'SPOILED')
                or (fi.status = 'STORED' and fi.expiry_date < current_date)
              )
            )
            or (:status <> 'EXPIRED' and fi.status = :status)
          )
          and (:categoryId is null or f.category_id = :categoryId)
        """, nativeQuery = true)
    Long countByStatusAndExpiryDateRange(
        @Param("familyId") Long familyId,
        @Param("status") String status,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") Long categoryId
    );

    @Query(value = """
        select fi.expiry_date as date, count(fi.id) as count
        from fridge_items fi
        join foods f on fi.food_id = f.id
        where fi.family_id = :familyId
          and fi.expiry_date between :from and :to
          and (
            (:status = 'EXPIRED'
              and (
                fi.status = 'EXPIRED'
                or fi.removed_reason in ('EXPIRED_DISCARDED', 'SPOILED')
                or (fi.status = 'STORED' and fi.expiry_date < current_date)
              )
            )
            or (:status <> 'EXPIRED' and fi.status = :status)
          )
          and (:categoryId is null or f.category_id = :categoryId)
        group by fi.expiry_date
        order by fi.expiry_date
        """, nativeQuery = true)
    List<DateCountProjection> countByStatusAndExpiryDateGroup(
        @Param("familyId") Long familyId,
        @Param("status") String status,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") Long categoryId
    );

    @Query(value = """
        select cast(coalesce(fi.removed_at, fi.updated_at) as date) as date, count(fi.id) as count
        from fridge_items fi
        join foods f on fi.food_id = f.id
        where fi.family_id = :familyId
          and (
            (:status = 'USED'
              and (fi.status = 'USED' or fi.removed_reason = 'USED_UP')
              and coalesce(fi.removed_at, fi.updated_at) >= :from
              and coalesce(fi.removed_at, fi.updated_at) < :to
            )
            or
            (:status <> 'USED'
              and fi.status = :status
              and fi.updated_at >= :from
              and fi.updated_at < :to
            )
          )
          and (:categoryId is null or f.category_id = :categoryId)
        group by cast(coalesce(fi.removed_at, fi.updated_at) as date)
        order by cast(coalesce(fi.removed_at, fi.updated_at) as date)
        """, nativeQuery = true)
    List<DateCountProjection> countByStatusAndUpdatedAtGroup(
        @Param("familyId") Long familyId,
        @Param("status") String status,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("categoryId") Long categoryId
    );
}
