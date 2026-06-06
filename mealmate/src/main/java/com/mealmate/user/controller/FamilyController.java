package com.mealmate.user.controller;

import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.model.dto.FamilyResponse;
import com.mealmate.user.service.FamilyService;
import com.mealmate.user.service.UserService; 
import com.mealmate.user.mapper.FamilyMapper;
import com.mealmate.user.repository.UserRepository; // 🎯 Bổ sung import Repo để lấy User sạch
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/familys")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FamilyController {

    private final FamilyService service;
    private final FamilyMapper familyMapper;
    private final UserService userService; 
    private final UserRepository userRepository; // 🎯 Inject trực tiếp Repo để triệt tiêu lỗi Hibernate Proxy

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
        
        // 🎯 GIẢI PHÁP: Tìm đối tượng sạch thông qua Email từ Token để tránh lỗi Lazy Loading Proxy
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

    // 🎯 GIỮ NGUYÊN VẸN 100%: Hàm invite cũ xử lý bọc dữ liệu an toàn của bạn
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
        boolean isSuccess = service.inviteMemberToFamily(familyId, userId);
        
        if (isSuccess) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Gửi lời mời thành công!", null));
        }
        return ResponseEntity.status(500).body(new ApiResponse<>(false, "Không thể thêm thành viên này!", null));
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
}
