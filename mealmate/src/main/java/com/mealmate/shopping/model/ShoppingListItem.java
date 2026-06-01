package com.mealmate.shopping.model;

import com.mealmate.catalog.model.Food;
import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shopping_list_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingListItem extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingList shoppingList; // Thuộc danh sách

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private Food food;

    private Double quantity;
    private String unit;
    private String note;
    private Long assignedTo;
    private Boolean isPurchased = false;
}
