package com.mealmate.shopping.model;

import java.time.LocalDateTime;

import com.mealmate.catalog.model.Food;
import com.mealmate.common.base.BaseEntity;
import com.mealmate.fridge.model.FridgeItem;
import com.mealmate.user.model.User;

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
    private ShoppingList shoppingList;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private Food food;

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "order_number")
    private Integer orderNumber;

    private Double quantity;
    private String unit;
    private String note;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "is_purchased")
    private Boolean isPurchased = false;

    @Column(name = "imported_to_fridge_at")
    private LocalDateTime importedToFridgeAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fridge_item_id")
    private FridgeItem fridgeItem;

    public void setAssignedTo(User user) {
        this.assignedTo = user == null ? null : user.getId();
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }
}
