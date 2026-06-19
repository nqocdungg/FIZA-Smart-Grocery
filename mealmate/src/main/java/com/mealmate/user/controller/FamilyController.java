package com.mealmate.user.controller;

import com.mealmate.notification.model.NotificationCategory;
import com.mealmate.notification.model.NotificationSeverity;
import com.mealmate.notification.service.NotificationService;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.model.dto.FamilyResponse;
import com.mealmate.user.service.FamilyService;
import com.mealmate.user.service.UserService;
import com.mealmate.user.mapper.FamilyMapper;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/users/familys", "/api/v1/users/family"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FamilyController {

    private final FamilyService service;
    private final FamilyMapper familyMapper;
    private final UserService userService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Family>>> getAll() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", service.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Family>> create(@RequestBody Family entity) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.save(entity)));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<FamilyResponse>> getCurrentFamily() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }
        
        // GIẢI PHÁP: Tìm đối tượng sạch thông qua Email từ Token để tránh lỗi Lazy Loading Proxy
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        
        if (currentUser == null || currentUser.getFamilyId() == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Tài khoản chưa tham gia nhóm", null));
        }
        
        Family family;
        try {
            family = service.findByFamilyId(currentUser.getFamilyId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Nhóm gia đình không tồn tại", null));
        }
        FamilyResponse response = familyMapper.toResponse(family);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilyResponse>> updateFamilyName(
            @PathVariable Long id, 
            @RequestBody FamilyResponse familyRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }
        
        Family family = service.findByFamilyId(id);
        
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Người dùng không tồn tại", null));
        }
        
        Long currentUserId = currentUser.getId(); 
        if (family.getHousekeeperId() == null || !family.getHousekeeperId().equals(currentUserId)) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Bạn không phải là chủ nhà!", null));
        }
        
        family.setName(familyRequest.getName());
        Family updatedFamily = service.save(family);
        FamilyResponse response = familyMapper.toResponse(updatedFamily);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật thành công!", response));
    }

    // =========================================================================
    // 🎯 BƯỚC CẬP NHẬT: Sửa lại thông điệp phản hồi lỗi thông minh ra Front-end
    // =========================================================================
    @PostMapping("/{id}/invite")
    public ResponseEntity<ApiResponse<Void>> inviteMember(
            @PathVariable("id") Long familyId, 
            @RequestBody Map<String, Object> requestBody) {
        
        if (requestBody == null || (!requestBody.containsKey("userId") && !requestBody.containsKey("userid"))) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số dữ liệu Body", null));
        }
        
        Object rawUserId = requestBody.get("userId") != null ? requestBody.get("userId") : requestBody.get("userid");
        if (rawUserId == null) {
            
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số userId", null));
        }
        
        Long userId = Long.valueOf(rawUserId.toString());
        User invitedUser = userRepository.findById(userId).orElse(null);
        if (isAdminRole(invitedUser)) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false,
                    "Không thể mời tài khoản quản trị viên vào gia đình.", null));
        }

        boolean isSuccess = service.inviteMemberToFamily(familyId, userId);

        if (isSuccess) {
            // Thông báo cho người được mời (Chỉ chạy khi tạo được bản ghi PENDING chính thức)
            try {
                Family family = service.findByFamilyId(familyId);
                String familyName = family != null ? family.getName() : "một gia đình";
                notificationService.push(userId, NotificationCategory.GROUP, NotificationSeverity.INFO,
                        "🏠 Bạn nhận được lời mời",
                        "Bạn được mời gia nhập nhóm gia đình \"" + familyName + "\". Hãy mở ứng dụng để phản hồi!");
            } catch (Exception ignored) {}
            return ResponseEntity.ok(new ApiResponse<>(true, "Gửi lời mời thành công!", null));
        }
        
        // 🎯 ĐÃ THAY ĐỔI: Phản hồi lỗi 400 kèm thông báo trực quan thay vì lỗi 500 sập hệ thống
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, 
                "Người dùng này hiện đã có nhóm gia đình cố định. Hệ thống đã chặn gửi lời mời và bắn thông báo lưu vết hụt đến hòm thư của họ.", null));
    }

    @GetMapping("/search-user")
    public ResponseEntity<ApiResponse<User>> searchUserInFamilyRoute(@RequestParam("keyword") String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Từ khóa trống", null));
            }
            User user = userService.searchByEmailOrPhone(keyword.trim());
            if (user == null) {
                return ResponseEntity.ok(new ApiResponse<>(false, "Không tìm thấy người dùng", null));
            }
            
            user.setPasswordHash(null); 
            user.setRole(null); 
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Tìm thấy thành viên", user));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    private boolean isAdminRole(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }

        Long roleId = user.getRole().getId();
        String roleName = user.getRole().getName();
        return Long.valueOf(1L).equals(roleId) || "ADMIN".equalsIgnoreCase(roleName);
    }
}
