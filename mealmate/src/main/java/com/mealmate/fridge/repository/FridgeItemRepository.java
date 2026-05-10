package com.mealmate.fridge.repository;

import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.fridge.model.FridgeItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FridgeItemRepository extends JpaRepository<FridgeItem, Long> {

    @Query(value = """
        SELECT 
            fi.id AS id,
            fi.family_id AS familyId,
            fi.food_id AS foodId,
            f.name AS standardFoodName,
            COALESCE(fi.custom_name, f.name) AS displayName,
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
            COALESCE(fi.custom_name, f.name) AS displayName,
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
        WHERE fi.family_id = :familyId
          AND fi.status = :status
          AND (
                LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
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
            @Param("keyword") String keyword
    );

    List<FridgeItem> findByFamilyIdAndStatus(Long familyId, String status);

    long countByFamilyIdAndStatus(Long familyId, String status);

    default long countStoredByFamilyId(Long familyId) {
        return countByFamilyIdAndStatus(familyId, FridgeItemStatus.STORED);
    }
}