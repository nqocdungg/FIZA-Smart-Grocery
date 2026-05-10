package com.mealmate.meal.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Meal extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu; // Thuộc thực đơn nào

    @Column(name = "meal_date", nullable = false)
    private java.time.LocalDate mealDate; // Ngày ăn

    @Column(name = "meal_type", nullable = false)
    private String mealType; // Loại bữa
}
