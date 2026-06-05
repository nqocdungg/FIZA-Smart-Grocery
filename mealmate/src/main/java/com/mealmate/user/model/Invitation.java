package com.mealmate.user.model;

import com.mealmate.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor  // Bắt buộc cho cấu trúc Hibernate
@AllArgsConstructor // Bắt buộc cho cấu trúc Builder
@Builder            // Kích hoạt tính năng khởi tạo Builder mẫu
public class Invitation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, DECLINED
}