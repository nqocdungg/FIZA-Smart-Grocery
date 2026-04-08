package com.mealmate.auth.model;

import com.mealmate.common.base.BaseEntity;
import com.mealmate.common.base.UserRef;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Mapping sang danh sách Permission (Tương đương array ObjectIds trong MongoDB)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private List<Permission> permissions;

    // Nhúng Object createdBy
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "id", column = @Column(name = "created_by_id")),
        @AttributeOverride(name = "email", column = @Column(name = "created_by_email"))
    })
    private UserRef createdBy;

    // Nhúng Object updatedBy
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "id", column = @Column(name = "updated_by_id")),
        @AttributeOverride(name = "email", column = @Column(name = "updated_by_email"))
    })
    private UserRef updatedBy;

    // Nhúng Object deletedBy (Hỗ trợ Soft Delete)
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "id", column = @Column(name = "deleted_by_id")),
        @AttributeOverride(name = "email", column = @Column(name = "deleted_by_email"))
    })
    private UserRef deletedBy;

}
