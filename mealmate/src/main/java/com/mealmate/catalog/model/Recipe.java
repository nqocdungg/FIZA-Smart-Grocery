package com.mealmate.catalog.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Recipe extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "cooking_time_minutes")
    private Integer cookingTimeMinutes;

    @Column(name = "servings")
    private Integer servings;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "difficulty")
    private String difficulty;

    @Column(name = "reference_link")
    private String referenceLink;

    @Column(name = "author")
    private String author;

    @Column(name = "preferred_meal_time")
    private String preferredMealTime;

    @Column(name = "display_status")
    private String displayStatus;

    @Column(name = "image_url")
    private String imageUrl;
}
