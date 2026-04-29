package com.mealmate.fridge.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fridge_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FridgeItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // TODO: Ad domain fields
}
