package com.mealmate.shopping.model;

import com.mealmate.catalog.model.Food;
import com.mealmate.common.base.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "is_purchased")
    private Boolean isPurchased = false;

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "imported_to_fridge_at")
    private java.time.LocalDateTime importedToFridgeAt;

    @OneToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "fridge_item_id")
    private com.mealmate.fridge.model.FridgeItem fridgeItem;

    @Column(name = "order_number")
    private Integer orderNumber;
}
