package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Recipe extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // Tên món ăn

    @Column(columnDefinition = "TEXT")
    private String instructions; // Hướng dẫn chế biến

    @Column(name = "reference_link")
    private String referenceLink; // Link tham khảo

    @Column(name = "author")
    private String author; // Tác giả công thức

    @Column(name = "preferred_meal_time")
    private String preferredMealTime; // Bữa ưu tiên

    @Column(name = "image_url")
    private String imageUrl; // Ảnh minh họa
}
