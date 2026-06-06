package com.mealmate.user.controller;

import com.mealmate.common.dto.ApiResponse;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.model.User;
import com.mealmate.user.model.dto.UserMemberResponse;
import com.mealmate.user.repository.InvitationRepository;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.user.service.FamilyService;
import com.mealmate.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
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
    private final PasswordEncoder passwordEncoder;

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

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<UserMemberResponse>> getCurrentUser() {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", toUserMemberResponse(currentUser)));
    }

    @GetMapping("/family/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFamilyMembers() {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }

        if (currentUser.getFamilyId() == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Chưa tham gia gia đình nào", List.of()));
        }

        List<Object[]> rawRows = userRepository.findRawMembersByFamilyId(currentUser.getFamilyId());
        List<Map<String, Object>> flatResponse = rawRows.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", row[0] != null ? ((Number) row[0]).longValue() : 0L);
                    map.put("email", row[1] != null ? row[1].toString() : "");
                    map.put("fullName", row[2] != null ? row[2].toString() : "Thành viên ẩn danh");
                    map.put("phone", row[3] != null ? row[3].toString() : "Chưa cập nhật");
                    map.put("gender", row[4] != null ? row[4].toString() : "OTHER");
                    map.put("avatarUrl", row[5] != null ? row[5].toString() : "");
                    map.put("roleName", row[6] != null ? row[6].toString() : "Thành viên");
                    map.put("familyId", row[7] != null ? ((Number) row[7]).longValue() : currentUser.getFamilyId());
                    map.put("roleId", row[8] != null ? ((Number) row[8]).longValue() : null);
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", flatResponse));
    }

    @GetMapping("/search-member")
    public ResponseEntity<ApiResponse<Object>> searchUser(@RequestParam("keyword") String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Từ khóa trống", new HashMap<>()));
        }

        User user = userRepository.findByEmailOrPhone(keyword.trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Không tìm thấy người dùng", new HashMap<>()));
        }

        Map<String, Object> cleanUserMap = new HashMap<>();
        cleanUserMap.put("id", user.getId());
        cleanUserMap.put("email", user.getEmail());
        cleanUserMap.put("fullName", user.getFullName());
        cleanUserMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        cleanUserMap.put("gender", user.getGender() != null ? user.getGender() : "OTHER");
        cleanUserMap.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        cleanUserMap.put("familyId", user.getFamilyId());

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", cleanUserMap));
    }

    @GetMapping("/check-invite")
    public ResponseEntity<ApiResponse<Object>> checkIncomingInvite() {
        User currentUser = resolveCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", new HashMap<>()));
        }

        Optional<Invitation> inviteOpt = invitationRepository
                .findFirstByReceiverIdAndStatusOrderByIdDesc(currentUser.getId(), "PENDING");

        if (inviteOpt.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Không có lời mời", new HashMap<>()));
        }

        Invitation invite = inviteOpt.get();
        Family family = familyService.findByFamilyId(invite.getFamilyId());
        if (family == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Lời mời thuộc về nhóm không tồn tại", new HashMap<>()));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("familyId", invite.getFamilyId());
        data.put("familyName", family.getName());

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", data));
    }

    @PostMapping("/accept-invite")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> acceptFamilyInvite(@RequestBody Map<String, Object> body) {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }

        if (body == null || !body.containsKey("familyId") || body.get("familyId") == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số familyId", null));
        }

        Long familyId = Long.valueOf(body.get("familyId").toString());
        Optional<Invitation> inviteOpt = invitationRepository
                .findByFamilyIdAndReceiverIdAndStatus(familyId, currentUser.getId(), "PENDING");

        if (inviteOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Không tìm thấy lời mời hợp lệ", null));
        }

        Invitation invite = inviteOpt.get();
        invite.setStatus("ACCEPTED");
        invitationRepository.save(invite);

        Family newFamily = new Family();
        newFamily.setId(familyId);
        currentUser.setFamily(newFamily);

        com.mealmate.auth.model.Role customerRole = new com.mealmate.auth.model.Role();
        customerRole.setId(2L);
        currentUser.setRole(customerRole);

        userRepository.save(currentUser);

        return ResponseEntity.ok(new ApiResponse<>(true, "Đồng ý gia nhập thành công!", null));
    }

    @PostMapping("/decline-invite")
    public ResponseEntity<ApiResponse<Void>> declineFamilyInvite() {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
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
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Chưa đăng nhập", null));
        }

        if (body == null || !body.containsKey("userId") || body.get("userId") == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Thiếu tham số userId", null));
        }

        Long targetUserId = Long.valueOf(body.get("userId").toString());
        Long targetFamilyId = userRepository.findActualFamilyIdByHousekeeperId(targetUserId);
        userRepository.updateFamilyAndRoleDirectlyNative(targetUserId, targetFamilyId, 3L);

        return ResponseEntity.ok(new ApiResponse<>(true, "Đã xóa thành viên khỏi gia đình", null));
    }

    @PutMapping("/profile")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(@RequestBody Map<String, Object> body) {
        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Tài khoản chưa đăng nhập hệ thống", null));
        }

        String newFullName = firstString(body, "fullName", "full_name");
        String newPhone = firstString(body, "phone", "phoneNumber", "phone_number");
        String newGender = firstString(body, "gender");
        String newPassword = firstString(body, "password");

        if (newFullName != null && !newFullName.trim().isEmpty()) {
            currentUser.setFullName(newFullName.trim());
        }
        if (newPhone != null) {
            currentUser.setPhone(newPhone.trim());
        }
        if (newGender != null && !newGender.trim().isEmpty()) {
            currentUser.setGender(newGender.trim().toUpperCase());
        }
        if (newPassword != null && newPassword.trim().length() >= 6) {
            currentUser.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        }

        userRepository.save(currentUser);

        Map<String, Object> result = new HashMap<>();
        result.put("email", currentUser.getEmail());
        result.put("fullName", currentUser.getFullName());
        result.put("phone", currentUser.getPhone());
        result.put("gender", currentUser.getGender());

        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật thông tin tài khoản thành công!", result));
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

    private String firstString(Map<String, Object> body, String... keys) {
        if (body == null) {
            return null;
        }
        for (String key : keys) {
            Object value = body.get(key);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }
}
