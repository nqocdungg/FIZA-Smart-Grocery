package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ImportShoppingItemsResponse {

    private int importedCount;

    private List<FridgeItemResponse> items;
}
