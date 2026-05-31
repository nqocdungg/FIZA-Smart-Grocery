package com.mealmate.user.controller;

import com.mealmate.user.model.User;
import com.mealmate.user.service.UserService;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Đảm bảo mở CORS để không bị chặn khi gọi từ React
public class UserController {

    private final UserService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> create(@RequestBody User entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> update(@PathVariable Long id, @RequestBody User entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated", service.update(id, entity)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Deleted", null));
    }

    // =========================================================================
    // 🎯 API LẤY DANH SÁCH THÀNH VIÊN TRONG GIA ĐÌNH ĐỘNG THEO TOKEN
    // =========================================================================
    @GetMapping("/family/members")
    public ResponseEntity<ApiResponse<List<User>>> getFamilyMembers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }

        // Ép kiểu thẳng về class User vì User đã triển khai UserDetails
        User currentUser = (User) authentication.getPrincipal();
        Long currentFamilyId = currentUser.getFamilyId();

        if (currentFamilyId == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Người dùng chưa tham gia vào gia đình nào", List.of()));
        }

        List<User> members = service.findByFamilyId(currentFamilyId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", members));
    }
}