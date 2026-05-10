package com.mealmate.fridge.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fridge_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FridgeItem extends BaseEntity {

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "food_id", nullable = false)
    private Long foodId;

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "quantity", nullable = false)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "storage_location")
    private String storageLocation;

    @Column(name = "specific_location")
    private String specificLocation;

    @Column(name = "added_date")
    private LocalDate addedDate = LocalDate.now();

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "status")
    private String status = FridgeItemStatus.STORED;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "note")
    private String note;

    @Column(name = "removed_reason")
    private String removedReason;

    @Column(name = "removed_reason_note")
    private String removedReasonNote;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @Column(name = "removed_by")
    private Long removedBy;

    @PrePersist
    public void prePersistFridgeItem() {
        if (addedDate == null) {
            addedDate = LocalDate.now();
        }
        if (status == null) {
            status = FridgeItemStatus.STORED;
        }
        if (quantity == null) {
            quantity = BigDecimal.ZERO;
        }
    }
}