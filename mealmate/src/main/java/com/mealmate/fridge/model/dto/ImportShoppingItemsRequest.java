package com.mealmate.fridge.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ImportShoppingItemsRequest {

    @NotEmpty(message = "items is required")
    private List<@Valid ImportShoppingItemRequest> items;
}
