package com.mealmate.shopping.mapper;

import org.mapstruct.Mapper;
import org.springframework.stereotype.Component;

import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.model.ShoppingListItem;

@Mapper(componentModel = "spring")
@Component
public class ShoppingMapper {
    public ShoppingItemDTO toItemDto(ShoppingListItem item) {
        ShoppingItemDTO dto = new ShoppingItemDTO();
        dto.setId(item.getId());
        dto.setFoodName(item.getFood().getName());
        dto.setCategoryName(item.getFood().getCategory().getName());
        dto.setFoodIcon(item.getFood().getCategory().getIconKey());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setIsPurchased(item.getIsPurchased());
        if (item.getAssignedTo() != null) {
            dto.setAssigneeName(item.getAssignedTo().getFullName());
        }
        return dto;
    }
}