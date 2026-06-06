package com.mealmate.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMissingIngredientsToShoppingListResponse {

    private Long shoppingListId;

    private Long recipeId;

    private int addedItemCount;

    private List<MissingIngredientDto> addedItems;
}
