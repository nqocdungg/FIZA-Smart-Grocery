package com.mealmate.auth.model;

import com.mealmate.common.base.BaseEntity;
import com.mealmate.common.base.UserRef;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Permission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "api_path", nullable = false)
    private String apiPath;

    @Column(nullable = false)
    private String method;

    @Column(nullable = false)
    private String module;

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
