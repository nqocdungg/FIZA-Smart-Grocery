package com.mealmate.shopping.mapper;

import org.springframework.stereotype.Component;

import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.model.ShoppingListItem;

@Component
public class ShoppingMapper {

    public ShoppingItemDTO toItemDto(ShoppingListItem item) {
        ShoppingItemDTO dto = new ShoppingItemDTO();

        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setIsPurchased(item.getIsPurchased());
        dto.setNote(item.getNote());
        dto.setCustomName(item.getCustomName());
        dto.setImportedToFridgeAt(item.getImportedToFridgeAt());
        if (item.getFridgeItem() != null) {
            dto.setFridgeItemId(item.getFridgeItem().getId());
        }

        if (item.getFood() != null) {
            dto.setFoodId(item.getFood().getId());
            dto.setFoodName(item.getFood().getName());
        }

        if (item.getAssignedTo() != null) {
            dto.setAssignedTo(item.getAssignedTo());
        } else {
            dto.setAssigneeName("Chưa giao");
        }
        return dto;
    }
}
