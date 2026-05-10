package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "preservation_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PreservationMethod extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private Food food; // Thực phẩm cần bảo quản

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Nội dung hướng dẫn bảo quản

    @Column(name = "reference_source")
    private String referenceSource; // Nguồn tham khảo
}
