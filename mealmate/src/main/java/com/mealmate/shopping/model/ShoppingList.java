package com.mealmate.shopping.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shoppinglists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingList extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // TODO: Ad domain fields
}
