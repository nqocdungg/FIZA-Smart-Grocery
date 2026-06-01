package com.mealmate.shopping.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "shopping_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingList extends BaseEntity {

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "family_id", nullable = false)
    private Long familyId; // Thuộc gia đình

    @Column(name = "planned_date")
    private java.time.LocalDate plannedDate; // Ngày dự kiến mua

    @Column(columnDefinition = "TEXT")
    private String note; // Ghi chú

    @OneToMany(mappedBy = "shoppingList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShoppingListItem> items = new ArrayList<>();

    //Sau thêm loại kế hoạch cho kế hoạch tuần
}
