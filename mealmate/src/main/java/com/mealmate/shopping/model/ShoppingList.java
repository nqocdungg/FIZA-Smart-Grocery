package com.mealmate.shopping.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shopping_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingList extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private com.mealmate.user.model.User createdBy; // Người tạo danh sách

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private com.mealmate.user.model.Family family; // Thuộc gia đình nào

    @Column(name = "created_date")
    private java.time.LocalDate createdDate; // Ngày tạo

    @Column(name = "planned_date")
    private java.time.LocalDate plannedDate; // Ngày dự kiến đi mua

    @Column(columnDefinition = "TEXT")
    private String note; // Ghi chú
}
