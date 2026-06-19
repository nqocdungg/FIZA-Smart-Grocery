package com.mealmate.user.service;

import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.user.repository.InvitationRepository;
import com.mealmate.notification.service.NotificationService;
import com.mealmate.notification.model.NotificationCategory;
import com.mealmate.notification.model.NotificationSeverity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository repository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final NotificationService notificationService;

    public List<Family> findAll() {
        return repository.findAll();
    }

    public Family save(Family entity) {
        return repository.save(entity);
    }

    public Family findByFamilyId(Long familyId) {
        if (familyId == null) {
            throw new IllegalArgumentException("Người dùng chưa tham gia vào bất kỳ nhóm gia đình nào!");
        }
        return repository.findById(familyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm gia đình với ID: " + familyId));
    }

    // =========================================================================
    // 🎯 THỐNG NHẤT NÂNG CẤP: Bắn thông báo song song cho CẢ HAI PHÍA khi bị chặn
    // =========================================================================
    @Transactional
    public boolean inviteMemberToFamily(Long familyId, Long userId) {
        System.out.println("👉 [SERVICE TỔNG] Bắt đầu xử lý ghi nhận lời mời: familyId = " + familyId + " | userId = " + userId);
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.err.println("❌ LỖI SERVICE: Không tìm thấy đối tượng User nhận trong hệ thống!");
            return false;
        }

        // 1. Lấy thông tin nhà đi mời và ID của chủ nhà đi mời (Housekeeper)
        Family currentFamily = repository.findById(familyId).orElse(null);
        String inviterFamilyName = currentFamily != null ? currentFamily.getName() : "Một gia đình";
        Long inviterHousekeeperId = currentFamily != null ? currentFamily.getHousekeeperId() : null;

        Long roleId = user.getRole() != null ? user.getRole().getId() : null;
        Long invitedUserFamilyId = user.getFamilyId();

        if (isAdminRole(user)) {
            System.out.println("Blocked invite: admin users cannot be invited to a family.");
            return false;
        }

        String finalStatus = "PENDING";
        boolean isBlocked = false;

        // ── KIỂM TRA ĐIỀU KIỆN CHẶN VÀ BẮN THÔNG BÁO CHO CẢ 2 BÊN ─────────────────
        if (invitedUserFamilyId != null) {
            
            // TRƯỜNG HỢP 1: Người được mời đang là Thành viên thường (role_id = 2)
            if (roleId != null && roleId == 2L) {
                // 🔔 Bên 1: Bắn thông báo cho người được mời (Người nhận)
                notificationService.push(
                        userId,
                        NotificationCategory.GROUP,
                        NotificationSeverity.MEDIUM,
                        "🏠 Lời mời gia đình bị từ chối tự động",
                        "Gia đình \"" + inviterFamilyName + "\" đã gửi lời mời gia nhập nhóm đến bạn. Tuy nhiên, vì bạn đang thuộc một nhóm gia đình khác, hệ thống đã tự động từ chối để bảo toàn dữ liệu."
                );
                
                // 🔔 Bên 2: Bắn thông báo cho chủ nhà đi mời (Người gửi)
                if (inviterHousekeeperId != null) {
                    notificationService.push(
                            inviterHousekeeperId,
                            NotificationCategory.GROUP,
                            NotificationSeverity.MEDIUM,
                            "❌ Gửi lời mời thất bại",
                            "Lời mời gửi đến \"" + user.getFullName() + "\" không thành công vì tài khoản này hiện đang là thành viên chính thức của một nhóm gia đình khác."
                    );
                }
                
                System.out.println("⚠️ Chặn lời mời: Đối phương đang là thành viên của nhà khác. Đã báo cho cả 2 phía.");
                finalStatus = "DECLINED";
                isBlocked = true;
            }

            // TRƯỜNG HỢP 2: Người được mời đang là Chủ nhà (role_id = 3) và nhà đông con (> 1 người)
            if (roleId != null && roleId == 3L) {
                long memberCount = userRepository.countByFamilyIdNative(invitedUserFamilyId);
                
                if (memberCount > 1) {
                    // 🔔 Bên 1: Bắn thông báo cho chủ nhà đối phương (Người nhận)
                    notificationService.push(
                            userId,
                            NotificationCategory.GROUP,
                            NotificationSeverity.HIGH,
                            "⚠️ Yêu cầu ghép nhóm bị chặn",
                            "Gia đình \"" + inviterFamilyName + "\" đã gửi lời mời ghép nhóm với bạn. Do bạn đang quản lý một gia đình gồm " + memberCount + " thành viên khác, hệ thống đã chặn yêu cầu để tránh bỏ rơi thành viên nhà bạn."
                    );
                    
                    // 🔔 Bên 2: Bắn thông báo cho chủ nhà bên mình (Người gửi)
                    if (inviterHousekeeperId != null) {
                        notificationService.push(
                                inviterHousekeeperId,
                                NotificationCategory.GROUP,
                                NotificationSeverity.MEDIUM,
                                "❌ Không thể mời gộp nhóm gia đình",
                                "Không thể gửi lời mời ghép nhóm đến chủ nhà \"" + user.getFullName() + "\" vì tài khoản này đang quản lý một gia đình có nhiều thành viên khác."
                        );
                    }
                    
                    System.out.println("⚠️ Chặn lời mời: Đối phương là chủ nhà đông người. Đã báo cho cả 2 phía.");
                    finalStatus = "DECLINED";
                    isBlocked = true;
                }
            }
        }

        // ── LƯU BẢN GHI VỚI TRẠNG THÁI CUỐI CÙNG ─────────────────────────────────
        Optional<Invitation> existingInvite = invitationRepository
                .findByFamilyIdAndReceiverIdAndStatus(familyId, userId, finalStatus);
        
        if (existingInvite.isPresent()) {
            System.out.println("⚠️ Thông báo: Đã tồn tại sẵn một lời mời với trạng thái " + finalStatus + ". Bỏ qua!");
            return !isBlocked; 
        }

        Invitation invitation = new Invitation();
        invitation.setFamilyId(familyId);
        invitation.setReceiverId(userId);
        invitation.setStatus(finalStatus); 

        invitationRepository.saveAndFlush(invitation);
        
        System.out.println("🔥 [HOÀN THÀNH SERVICE] Đã lưu bản ghi với trạng thái: " + finalStatus);
        return !isBlocked; 
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
