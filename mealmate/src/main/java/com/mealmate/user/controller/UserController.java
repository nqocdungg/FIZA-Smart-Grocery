package com.mealmate.user.controller;

import com.mealmate.notification.model.NotificationCategory;
import com.mealmate.notification.model.NotificationSeverity;
import com.mealmate.notification.service.NotificationService;
import com.mealmate.user.model.User;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.dto.UserMemberResponse;
import com.mealmate.user.model.dto.UserResponse;
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
import com.mealmate.auth.service.EmailService;


@RestController
@RequestMapping("/api/v1/users/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService service;
    private final InvitationRepository invitationRepository;
    private final FamilyService familyService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.mealmate.auth.service.EmailService emailService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAll() {
        List<UserResponse> users = userRepository.findAllWithFamilyAndRole().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .gender(user.getGender())
                        .avatarUrl(user.getAvatarUrl())
                        .emailVerified(user.getEmailVerified())
                        .familyId(user.getFamilyId())
                        .familyName(user.getFamily() != null ? user.getFamily().getName() : null)
                        .roleName(user.getRole() != null ? user.getRole().getName() : null)
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", users));
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

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<UserMemberResponse>> getCurrentUser() {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chua dang nhap", null));
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", toUserMemberResponse(currentUser)));
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

            Family currentFamily = familyService.findByFamilyId(cleanCurrentUser.getFamilyId());
            
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
                map.put("familyId", currentFamily.getId());
                map.put("familyName", currentFamily.getName());
                map.put("housekeeperId", currentFamily.getHousekeeperId());
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

                // 4. Thông báo: housekeeper biết có người vào nhà
                try {
                    Family joinedFamily = familyService.findByFamilyId(familyId);
                    if (joinedFamily != null && joinedFamily.getHousekeeperId() != null
                            && !joinedFamily.getHousekeeperId().equals(currentUser.getId())) {
                        notificationService.push(
                                joinedFamily.getHousekeeperId(),
                                NotificationCategory.GROUP, NotificationSeverity.NORMAL,
                                "🎉 Thành viên mới vào nhóm",
                                currentUser.getFullName() + " đã chấp nhận lời mời và gia nhập gia đình của bạn.");
                    }
                } catch (Exception ignored) {}

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
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> removeMemberFromFamily(@RequestBody Map<String, Object> body) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
            }

            if (body == null || !body.containsKey("userId") || body.get("userId") == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số userId", null));
            }

            Long targetUserId = Long.valueOf(body.get("userId").toString());
            String currentEmail = authentication.getName();
            User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
            User targetUser = userRepository.findById(targetUserId).orElse(null);

            if (currentUser == null || targetUser == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy người dùng", null));
            }

            Long currentFamilyId = currentUser.getFamilyId();
            Long targetCurrentFamilyId = targetUser.getFamilyId();
            if (currentFamilyId == null || targetCurrentFamilyId == null || !currentFamilyId.equals(targetCurrentFamilyId)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Người dùng không thuộc cùng nhóm gia đình", null));
            }

            Family currentFamily = familyService.findByFamilyId(currentFamilyId);
            boolean isSelfLeave = currentUser.getId().equals(targetUserId);
            boolean isHousekeeper = currentFamily.getHousekeeperId() != null
                    && currentFamily.getHousekeeperId().equals(currentUser.getId());

            if (!isSelfLeave && !isHousekeeper) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Chỉ chủ nhà mới có quyền xóa thành viên", null));
            }
            if (currentFamily.getHousekeeperId() != null && currentFamily.getHousekeeperId().equals(targetUserId)) {
                return ResponseEntity.status(400).body(new ApiResponse<>(false, "Chủ nhà không thể rời nhóm bằng thao tác này", null));
            }

            Long restoredFamilyId = userRepository.findActualFamilyIdByHousekeeperId(targetUserId);
            if (restoredFamilyId == null || restoredFamilyId.equals(currentFamilyId)) {
                Family personalFamily = new Family();
                personalFamily.setName("Gia đình " + targetUser.getFullName());
                personalFamily.setHousekeeperId(targetUserId);
                restoredFamilyId = familyService.save(personalFamily).getId();
            }

            userRepository.updateFamilyAndRoleDirectlyNative(targetUserId, restoredFamilyId, 3L);

            // Thông báo cho người bị/tự rời nhóm
            try {
                if (isSelfLeave) {
                    // Báo cho các thành viên còn lại biết có người rời nhóm
                    userRepository.findByFamily_IdOrderByIdAsc(currentFamilyId).stream()
                            .filter(u -> !u.getId().equals(targetUserId))
                            .forEach(u -> notificationService.push(
                                    u.getId(), NotificationCategory.GROUP, NotificationSeverity.MEDIUM,
                                    "👋 Thành viên rời nhóm",
                                    targetUser.getFullName() + " vừa rời khỏi nhóm gia đình."));
                } else {
                    // Báo cho người bị kick
                    notificationService.push(
                            targetUserId, NotificationCategory.GROUP, NotificationSeverity.HIGH,
                            "🚪 Bạn đã bị xoá khỏi nhóm",
                            "Bạn đã bị xoá khỏi nhóm gia đình bởi " + currentUser.getFullName() + ".");
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(new ApiResponse<>(
                    true,
                    isSelfLeave ? "Đã rời nhóm thành công!" : "Đã xóa thành viên khỏi nhóm thành công!",
                    null
            ));

        } catch (Exception e) {
            System.err.println("Lỗi API remove-member: " + e.getMessage());
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
                            
            String newGender    = body.containsKey("gender")    ? body.get("gender").toString()    : null;
            String newPassword  = body.containsKey("password")  ? body.get("password").toString()  : null;
            String newAvatarUrl = body.containsKey("avatarUrl") ? body.get("avatarUrl").toString() : null;

            // 3. Tiến hành gán cập nhật dữ liệu vào thực thể User
            if (newFullName != null && !newFullName.trim().isEmpty()) {
                currentUser.setFullName(newFullName.trim());
            }
            if (newPhone != null) {
                currentUser.setPhone(newPhone.trim());
            }
            if (newGender != null && !newGender.trim().isEmpty()) {
                currentUser.setGender(newGender.trim().toUpperCase());
            }
            // Lưu avatar URL mới từ Cloudinary (nếu có)
            if (newAvatarUrl != null && !newAvatarUrl.trim().isEmpty()) {
                currentUser.setAvatarUrl(newAvatarUrl.trim());
            }

            // Xử lý mật khẩu mới
            if (newPassword != null && newPassword.trim().length() >= 6) {
                currentUser.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
            }

            // 4. Lưu xuống Database
            userRepository.save(currentUser);

            // Phản hồi đầy đủ (bao gồm avatarUrl mới) để frontend cập nhật localStorage ngay
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("email",     currentUser.getEmail());
            result.put("fullName",  currentUser.getFullName());
            result.put("phone",     currentUser.getPhone());
            result.put("gender",    currentUser.getGender());
            result.put("avatarUrl", currentUser.getAvatarUrl() != null ? currentUser.getAvatarUrl() : "");

            return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật thông tin tài khoản thành công!", result));

        } catch (Exception e) {
            System.err.println("❌ LỖI SẬP TẠI API PUT PROFILE CONTROLLER: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống khi cập nhật: " + e.getMessage(), null));
        }
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }

        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private UserMemberResponse toUserMemberResponse(User user) {
        return UserMemberResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleId(user.getRole() != null ? user.getRole().getId() : null)
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .familyId(user.getFamilyId())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
    @PostMapping("/forgot-password/request")
    public ResponseEntity<ApiResponse<Void>> requestTemporaryPassword(@RequestBody Map<String, String> body) {
        try {
            String keyword = body.get("keyword");
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Vui lòng nhập Email hoặc Số điện thoại!", null));
            }

            // Tìm kiếm tài khoản (đã hỗ trợ cả Email lẫn SĐT và chống trùng dữ liệu rác)
            User user = userRepository.findByEmailOrPhone(keyword.trim()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(false, "Tài khoản không tồn tại trên hệ thống Fiza!", null));
            }

            // 1. Tự động sinh chuỗi mật khẩu ngẫu nhiên gồm 8 ký tự (gồm chữ cái và số)
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            StringBuilder tempPasswordBuilder = new StringBuilder();
            java.util.Random rnd = new java.util.Random();
            while (tempPasswordBuilder.length() < 8) { 
                tempPasswordBuilder.append(chars.charAt(rnd.nextInt(chars.length())));
            }
            String temporaryPassword = tempPasswordBuilder.toString();

            // 2. Mã hóa mật khẩu tạm bằng bộ mã hóa BCryptEncoder của dự án và lưu đè xuống CSDL
            user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
            userRepository.save(user);

            // 3. Tiến hành bắn Email chứa mật khẩu tạm về tài khoản Gmail thật của người dùng
            try {
                // Luôn lấy email thật từ database (user.getEmail()) đề phòng trường hợp họ gõ SĐT ở Front-end
                emailService.sendTemporaryPasswordEmail(user.getEmail(), temporaryPassword);
            } catch (Exception e) {
                System.err.println("⚠️ Cảnh báo lỗi gửi mail SMTP: " + e.getMessage());
            }

            // 4. In backup ra console đen phòng trường hợp bạn chưa cấu hình thông số SMTP trong file properties
            System.out.println("=========================================================");
            System.out.println("🎟️ [FIZA SMART KITCHEN] RESET MẬT KHẨU TỰ ĐỘNG CÔNG CỘNG");
            System.out.println("👉 Tài khoản: " + user.getEmail());
            System.out.println("🔥 MẬT KHẨU TẠM THỜI MỚI SINH: " + temporaryPassword);
            System.out.println("=========================================================");

            return ResponseEntity.ok(new ApiResponse<>(true, "Mật khẩu tạm thời đã được gửi thành công về Gmail của bạn!", null));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi hệ thống khôi phục mật khẩu: " + e.getMessage(), null));
        }
    }
}
