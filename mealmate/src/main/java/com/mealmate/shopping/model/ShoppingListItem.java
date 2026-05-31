package com.mealmate.shopping.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import com.mealmate.fridge.model.FridgeItem;

import java.time.LocalDateTime;

@Entity
@Table(name = "shopping_list_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingListItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingList shoppingList; // Thuộc danh sách nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private com.mealmate.catalog.model.Food food; // Thực phẩm cần mua

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "order_number")
    private Integer orderNumber; // Số thứ tự

    @Column(nullable = false)
    private Double quantity; // Số lượng cần mua

    @Column(name = "unit")
    private String unit; // Đơn vị tính

    @Column(columnDefinition = "TEXT")
    private String note; // Ghi chú thêm

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private com.mealmate.user.model.User assignedTo; // Người được giao mua

    @Column(name = "is_purchased")
    private Boolean isPurchased = false; // Đã mua chưa

    @Column(name = "imported_to_fridge_at")
    private LocalDateTime importedToFridgeAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fridge_item_id")
    private FridgeItem fridgeItem;
}
