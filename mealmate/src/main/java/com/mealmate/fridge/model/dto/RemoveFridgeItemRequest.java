package com.mealmate.fridge.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RemoveFridgeItemRequest {

    @NotBlank(message = "removedReason is required")
    private String removedReason;

    private String removedReasonNote;

    @NotNull(message = "removedBy is required")
    private Long removedBy;
}