package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class FridgeItemResponse {

    private Long id;

    private Long familyId;

    private Long foodId;

    private String standardFoodName;

    private String displayName;

    private BigDecimal quantity;

    private String storageLocation;

    private String specificLocation;

    private LocalDate addedDate;

    private LocalDate expiryDate;

    private String status;

    private String imageUrl;

    private String note;

    private String removedReason;

    private String removedReasonNote;

    private LocalDateTime removedAt;

    private Long removedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}