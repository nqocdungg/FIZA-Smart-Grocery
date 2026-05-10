package com.mealmate.meal.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Menu extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private com.mealmate.user.model.Family family; // Thuộc gia đình nào

    @Column(name = "start_date", nullable = false)
    private java.time.LocalDate startDate; // Ngày bắt đầu

    @Column(name = "end_date", nullable = false)
    private java.time.LocalDate endDate; // Ngày kết thúc
}
