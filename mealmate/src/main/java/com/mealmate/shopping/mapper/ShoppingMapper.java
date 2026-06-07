package com.mealmate.shopping.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.model.ShoppingListItem;
import com.mealmate.user.repository.UserRepository;

@Component
public class ShoppingMapper {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;

    public ShoppingItemDTO toItemDto(ShoppingListItem item) {
        ShoppingItemDTO dto = new ShoppingItemDTO();

        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setIsPurchased(item.getIsPurchased());
        dto.setNote(item.getNote());
        dto.setImportedToFridgeAt(item.getImportedToFridgeAt());
        if (item.getFridgeItem() != null) {
            dto.setFridgeItemId(item.getFridgeItem().getId());
        }

        if (item.getFood() != null) {
            dto.setFoodId(item.getFood().getId());
            dto.setFoodName(item.getFood().getName());

            Long catId = item.getFood().getCategoryId();
            if (catId != null) {
                categoryRepository.findById(catId).ifPresent(cat -> {
                    dto.setCategoryName(cat.getName());
                    dto.setFoodIcon(cat.getIconKey());
                });
            }
        }

        if (item.getAssignedTo() != null) {
            dto.setAssignedTo(item.getAssignedTo());
            userRepository.findById(item.getAssignedTo()).ifPresent(u -> {
                dto.setAssigneeName(u.getFullName());
            });
        } else {
            dto.setAssigneeName("Chưa giao");
        }
        return dto;
    }
}
