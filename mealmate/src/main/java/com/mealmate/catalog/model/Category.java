package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // Tên chủng loại: Rau củ, Thịt, Hải sản...

    @Column(name = "icon_key")
    private String iconKey; // Mã icon mặc định của chủng loại

    @Column(name = "color_code")
    private String colorCode; // Mã màu hiển thị mặc định
}
