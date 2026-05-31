package com.mealmate.user.controller;

import com.mealmate.user.model.User;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.model.Family;
import com.mealmate.user.service.UserService;
import com.mealmate.user.service.FamilyService;
import com.mealmate.user.repository.InvitationRepository;
import com.mealmate.user.repository.UserRepository; 
import com.mealmate.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/v1/users/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService service;
    private final InvitationRepository invitationRepository;
    private final FamilyService familyService;
    private final UserRepository userRepository; 
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFamilyMembers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }
        
        try {
            String currentEmail = authentication.getName();
            User cleanCurrentUser = userRepository.findByEmail(currentEmail).orElse(null);

            if (cleanCurrentUser == null || cleanCurrentUser.getFamilyId() == null) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Chưa tham gia gia đình nào", List.of()));
            }
            
            List<Object[]> rawRows = userRepository.findRawMembersByFamilyId(cleanCurrentUser.getFamilyId());
            
            List<Map<String, Object>> flatResponse = rawRows.stream().map(row -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", row[0] != null ? ((Number) row[0]).longValue() : 0L);
                map.put("email", row[1] != null ? row[1].toString() : "");
                map.put("fullName", row[2] != null ? row[2].toString() : "Thành viên ẩn danh");
                map.put("phone", row[3] != null ? row[3].toString() : "Chưa cập nhật");
                map.put("gender", row[4] != null ? row[4].toString() : "OTHER");
                map.put("avatarUrl", row[5] != null ? row[5].toString() : "");
                map.put("roleName", row[6] != null ? row[6].toString() : "Thành viên");
                return map;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Success", flatResponse));
            
        } catch (Exception e) {
            System.err.println("❌ LỖI KHẨN CẤP TẠI GET MEMBERS: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi bóc tách: " + e.getMessage(), null));
        }
    }

    @GetMapping("/search-member")
    public ResponseEntity<ApiResponse<Object>> searchUser(@RequestParam("keyword") String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Từ khóa trống", new java.util.HashMap<>()));
            }
            
            User user = userRepository.findByEmailOrPhone(keyword.trim()).orElse(null);
            if (user == null) {
                return ResponseEntity.ok(new ApiResponse<>(false, "Không tìm thấy người dùng", new java.util.HashMap<>()));
            }
            
            Map<String, Object> cleanUserMap = new java.util.HashMap<>();
            cleanUserMap.put("id", user.getId());
            cleanUserMap.put("email", user.getEmail());
            cleanUserMap.put("fullName", user.getFullName());
            cleanUserMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
            cleanUserMap.put("gender", user.getGender() != null ? user.getGender() : "OTHER");
            cleanUserMap.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
            cleanUserMap.put("familyId", user.getFamilyId());

            return ResponseEntity.ok(new ApiResponse<>(true, "Success", cleanUserMap));
        } catch (Exception e) {
            System.err.println("❌ LỖI SẬP KHI SEARCH USER TRÊN CONTROLLER: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống tìm kiếm: " + e.getMessage(), new java.util.HashMap<>()));
        }
    }

    @GetMapping("/check-invite")
    public ResponseEntity<ApiResponse<Object>> checkIncomingInvite() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", new java.util.HashMap<>()));
        }
        
        try {
            String currentEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
            
            if (currentUser == null || currentUser.getId() == null) {
                return ResponseEntity.ok(new ApiResponse<>(false, "Không tìm thấy thông tin cơ bản người dùng", new java.util.HashMap<>()));
            }

            Optional<Invitation> inviteOpt = invitationRepository
                    .findFirstByReceiverIdAndStatusOrderByIdDesc(currentUser.getId(), "PENDING");

            if (inviteOpt.isPresent()) {
                Invitation invite = inviteOpt.get();
                try {
                    Family family = familyService.findByFamilyId(invite.getFamilyId());
                    if (family == null) {
                        return ResponseEntity.ok(new ApiResponse<>(false, "Lời mời thuộc về nhóm không tồn tại", new java.util.HashMap<>()));
                    }
                    
                    Map<String, Object> data = new java.util.HashMap<>();
                    data.put("familyId", invite.getFamilyId());
                    data.put("familyName", family.getName());
                    
                    return ResponseEntity.ok(new ApiResponse<>(true, "Success", data));
                } catch (Exception e) {
                    return ResponseEntity.ok(new ApiResponse<>(false, "Lời mời thuộc về nhóm không tồn tại", new java.util.HashMap<>()));
                }
            }
            
            return ResponseEntity.ok(new ApiResponse<>(false, "Không có lời mời", new java.util.HashMap<>()));
            
        } catch (Exception e) {
            System.err.println("⚠️ Cảnh báo lỗi Check Invite: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(false, "Không có lời mời mới", new java.util.HashMap<>()));
        }
    }

    @PostMapping("/accept-invite")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> acceptFamilyInvite(@RequestBody Map<String, Object> body) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
            }
        
            if (body == null || !body.containsKey("familyId") || body.get("familyId") == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số familyId", null));
            }
        
            Long familyId = Long.valueOf(body.get("familyId").toString());
            String currentEmail = authentication.getName();
        
            User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy người dùng", null));
            }

            Optional<Invitation> inviteOpt = invitationRepository
                    .findByFamilyIdAndReceiverIdAndStatus(familyId, currentUser.getId(), "PENDING");

            if (inviteOpt.isPresent()) {
                Invitation invite = inviteOpt.get();
                
                // 1. Chuyển trạng thái lời mời sang ACCEPTED
                invite.setStatus("ACCEPTED");
                invitationRepository.save(invite);
                
                // 2. Tạo thực thể trống chứa ID mới để gán thẳng vào User (Lách hoàn toàn lỗi altered)
                Family newFamily = new Family();
                newFamily.setId(familyId);
                currentUser.setFamily(newFamily);
                
                com.mealmate.auth.model.Role customerRole = new com.mealmate.auth.model.Role();
                customerRole.setId(2L); // Ép cứng về Role ID = 2 (Thành viên)
                currentUser.setRole(customerRole);

                // 3. Lưu User cập nhật nhà mới xuống DB
                userRepository.save(currentUser);
                
                return ResponseEntity.ok(new ApiResponse<>(true, "Đồng ý gia nhập thành công!", null));
            }
            
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy lời mời hợp lệ", null));
        
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping("/decline-invite")
    public ResponseEntity<ApiResponse<Void>> declineFamilyInvite() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }
        
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy người dùng", null));
        }

        Optional<Invitation> inviteOpt = invitationRepository
                .findFirstByReceiverIdAndStatusOrderByIdDesc(currentUser.getId(), "PENDING");

        if (inviteOpt.isPresent()) {
            Invitation invite = inviteOpt.get();
            invite.setStatus("DECLINED");
            invitationRepository.save(invite);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Đã từ chối", null));
    }

    @PostMapping("/remove-member")
    @org.springframework.transaction.annotation.Transactional // Bắt buộc để chạy lệnh ghi DB
    public ResponseEntity<ApiResponse<Void>> removeMemberFromFamily(@RequestBody Map<String, Object> body) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
            }

            if (body == null || !body.containsKey("userId") || body.get("userId") == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số userId", null));
            }
            Long targetUserId = Long.valueOf(body.get("userId").toString()); // Người bị xóa (ID = 5)

            // 1. Dò tìm chính xác ID của ngôi nhà mà người này đứng tên quản lý (Sẽ trả ra số 3)
            Long targetFamilyId = userRepository.findActualFamilyIdByHousekeeperId(targetUserId);

            // 🎯 IN LOG ĐỂ KIỂM TRÁI CHUẨN XÁC CON SỐ TRÊN CONSOLE SERVER
            System.out.println("====== 🔍 TRỤC XUẤT DEBUG ======");
            System.out.println("-> Người bị xóa (targetUserId): " + targetUserId);
            System.out.println("-> ID Nhà gốc bốc được từ DB (targetFamilyId): " + targetFamilyId);
            System.out.println("=================================");

            // 2. Kích hoạt câu lệnh UPDATE thô native xuống PostgreSQL
            // Gán family_id = 3 (targetFamilyId), role_id = 3 (BOSS) cho user_id = 5
            userRepository.updateFamilyAndRoleDirectlyNative(targetUserId, targetFamilyId, 3L);

            return ResponseEntity.ok(new ApiResponse<>(true, "Đã trục xuất thành viên và trả về làm chủ nhà gốc thành công!", null));

        } catch (Exception e) {
            System.err.println("❌ LỖI API TRỤC XUẤT THÀNH VIÊN: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống khi xóa: " + e.getMessage(), null));
        }
    }
    @PutMapping("/profile")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(@RequestBody Map<String, Object> body) {
        try {
            // 1. Lấy thông tin tài khoản đang đăng nhập từ Spring Security Context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Tài khoản chưa đăng nhập hệ thống", null));
            }
            
            String currentEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy thông tin người dùng", null));
            }

            // 2. Phân tách an toàn dữ liệu từ payload (Đồng bộ cả CamelCase lẫn snake_case)
            String newFullName = body.containsKey("fullName") ? body.get("fullName").toString() 
                               : body.containsKey("full_name") ? body.get("full_name").toString() 
                               : null;
                               
            String newPhone = body.containsKey("phone") ? body.get("phone").toString() 
                            : body.containsKey("phoneNumber") ? body.get("phoneNumber").toString() 
                            : body.containsKey("phone_number") ? body.get("phone_number").toString() 
                            : null;
                            
            String newGender = body.containsKey("gender") ? body.get("gender").toString() : null;
            String newPassword = body.containsKey("password") ? body.get("password").toString() : null;

            // 3. Tiến hành gán cập nhật dữ liệu vào thực thể User
            if (newFullName != null && !newFullName.trim().isEmpty()) {
                currentUser.setFullName(newFullName.trim());
            }
            if (newPhone != null) {
                currentUser.setPhone(newPhone.trim());
            }
            if (newGender != null && !newGender.trim().isEmpty()) {
                currentUser.setGender(newGender.trim().toUpperCase()); // Lưu 'MALE', 'FEMALE', 'OTHER'
            }
            
            // 🎯 XỬ LÝ MẬT KHẨU MỚI: Nếu Front-end có truyền lên chuỗi mật khẩu hợp lệ thì tiến hành băm mã hóa
            if (newPassword != null && newPassword.trim().length() >= 6) {
                currentUser.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
                System.out.println("🎉 Đã băm mã hóa và cập nhật mật khẩu mới thành công cho user: " + currentEmail);
            }

            // 4. Lưu ghi đè dữ liệu xuống Database
            userRepository.save(currentUser);

            // Đóng gói thông tin mới phản hồi về cho React nhận diện
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("email", currentUser.getEmail());
            result.put("fullName", currentUser.getFullName());
            result.put("phone", currentUser.getPhone());
            result.put("gender", currentUser.getGender());

            return ResponseEntity.ok(new ApiResponse<>(true, "🎉 Cập nhật thông tin tài khoản thành công!", result));

        } catch (Exception e) {
            System.err.println("❌ LỖI SẬP TẠI API PUT PROFILE CONTROLLER: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống khi cập nhật: " + e.getMessage(), null));
        }
    }
}