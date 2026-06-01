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
    @Column(nullable = false)
    private String name;

    @Column(name = "icon_key")
    private String iconKey;

    @Column(name = "color_code")
    private String colorCode;
}
