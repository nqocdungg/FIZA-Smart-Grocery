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
    private String description; // Mô tả ngắn hiển thị ở trang chi tiết

    @Column(columnDefinition = "TEXT")
    private String instructions; // Hướng dẫn chế biến

    @Column(name = "cooking_time_minutes")
    private Integer cookingTimeMinutes; // Thời gian nấu dự kiến (phút)

    @Column(name = "servings")
    private Integer servings; // Số khẩu phần

    @Column(name = "calories")
    private Integer calories; // Tổng năng lượng ước tính (kcal)

    @Column(name = "difficulty")
    private String difficulty; // Độ khó: EASY, MEDIUM, HARD

    @Column(name = "reference_link")
    private String referenceLink; // Link tham khảo

    @Column(name = "author")
    private String author; // Tác giả công thức

    @Column(name = "preferred_meal_time")
    private String preferredMealTime; // Bữa ưu tiên

    @Column(name = "image_url")
    private String imageUrl; // Ảnh minh họa
}
