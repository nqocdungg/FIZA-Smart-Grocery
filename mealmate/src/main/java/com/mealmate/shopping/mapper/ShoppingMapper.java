package com.mealmate.shopping.mapper;

import com.mealmate.catalog.model.Category;
import com.mealmate.catalog.repository.CategoryRepository;
import com.mealmate.user.repository.UserRepository;
import org.mapstruct.Mapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.mealmate.shopping.dto.ShoppingItemDTO;
import com.mealmate.shopping.model.ShoppingListItem;

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

        if (item.getFood() != null) {
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
            userRepository.findById(item.getAssignedTo()).ifPresent(u -> {
                dto.setAssigneeName(u.getFullName());
            });
        } else {
            dto.setAssigneeName("Chưa giao");
        }
        return dto;
    }
}
