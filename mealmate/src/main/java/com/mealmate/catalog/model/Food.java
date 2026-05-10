package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "foods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Food extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category; // Thuộc chủng loại nào

    @Column(nullable = false)
    private String name; // Tên thực phẩm

    @Column(name = "unit")
    private String unit; // Đơn vị đo

    @Column(name = "synonyms")
    private String synonyms; // Từ đồng nghĩa

    @Column(name = "image_url")
    private String imageUrl; // Đường dẫn ảnh minh họa
}
