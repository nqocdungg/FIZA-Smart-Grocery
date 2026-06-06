package com.mealmate.shopping.model;

import com.mealmate.common.base.BaseEntity;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shopping_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingList extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(columnDefinition = "TEXT")
    private String note;

    @OneToMany(mappedBy = "shoppingList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShoppingListItem> items = new ArrayList<>();

    public Long getFamilyId() {
        return family == null ? null : family.getId();
    }

    public void setFamilyId(Long familyId) {
        if (familyId == null) {
            this.family = null;
            return;
        }
        Family familyRef = new Family();
        familyRef.setId(familyId);
        this.family = familyRef;
    }

    public void setCreatedBy(Long userId) {
        if (userId == null) {
            this.createdBy = null;
            return;
        }
        User userRef = new User();
        userRef.setId(userId);
        this.createdBy = userRef;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
}
