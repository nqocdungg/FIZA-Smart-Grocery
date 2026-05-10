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

    @Column(name = "category_id")
    private Long categoryId;

    @Column(nullable = false)
    private String name;

    private String unit;

    private String synonyms;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "icon_key")
    private String iconKey;

    @Column(name = "is_system")
    private Boolean isSystem = true;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "family_id")
    private Long familyId;

    @PrePersist
    public void prePersistFood() {
        if (isSystem == null) {
            isSystem = true;
        }
    }
}