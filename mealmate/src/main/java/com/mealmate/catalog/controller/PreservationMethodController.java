package com.mealmate.catalog.controller;

import com.mealmate.catalog.model.PreservationMethod;
import com.mealmate.catalog.service.PreservationMethodService;
import com.mealmate.catalog.model.dto.PreservationMethodResponse; // Import DTO mới tạo
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs/preservationmethods")
@RequiredArgsConstructor
public class PreservationMethodController {

    private final PreservationMethodService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PreservationMethod>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PreservationMethod>> create(@RequestBody PreservationMethod entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }

    // 🎯 THÊM ĐOẠN API MỚI NÀY: Tra cứu gọn gàng, đập tan lỗi ByteBuddyInterceptor
    @GetMapping("/food/{foodId}")
    public ResponseEntity<ApiResponse<PreservationMethodResponse>> getByFoodId(@PathVariable Long foodId) {
        PreservationMethod method = service.findByFoodId(foodId);
        
        if (method == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Chưa cấu hình", null));
        }

        // Chuyển đổi sang cấu trúc phẳng sạch sẽ tuyệt đối
        PreservationMethodResponse response = PreservationMethodResponse.builder()
                .id(method.getId())
                .foodId(foodId)
                .content(method.getContent())
                .referenceSource(method.getReferenceSource())
                .build();

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", response));
    }
}