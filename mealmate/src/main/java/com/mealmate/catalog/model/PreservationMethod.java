package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "preservationmethods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PreservationMethod extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // TODO: Ad domain fields
}
