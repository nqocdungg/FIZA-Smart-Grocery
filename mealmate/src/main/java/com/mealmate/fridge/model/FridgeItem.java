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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private com.mealmate.user.model.Family family; // Thuộc gia đình nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private com.mealmate.catalog.model.Food food; // Thực phẩm gì

    @Column(nullable = false)
    private Double quantity; // Số lượng

    @Column(name = "storage_location")
    private String storageLocation; // Vị trí lưu trữ

    @Column(name = "added_date")
    private java.time.LocalDate addedDate; // Ngày nhập vào tủ

    @Column(name = "expiry_date")
    private java.time.LocalDate expiryDate; // Hạn sử dụng

    @Column(name = "status")
    private String status; // Trạng thái

    @Column(name = "image_url")
    private String imageUrl; // Ảnh chụp thực phẩm trong tủ
}
