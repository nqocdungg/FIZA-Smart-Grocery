package com.mealmate.user.service;

import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.user.repository.InvitationRepository;

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
    // 🎯 SỬA FULL: Thay .save() bằng .saveAndFlush() để ép nổ ngay lệnh INSERT dưới DB
    // =========================================================================
    @Transactional
    public boolean inviteMemberToFamily(Long familyId, Long userId) {
        System.out.println("👉 [SERVICE TỔNG] Bắt đầu xử lý ghi nhận lời mời: familyId = " + familyId + " | userId = " + userId);
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.err.println("❌ LỖI SERVICE: Không tìm thấy đối tượng User nhận trong hệ thống!");
            return false;
        }

        // Kiểm tra xem đã có lời mời PENDING trùng lặp nào tồn tại chưa
        Optional<Invitation> existingInvite = invitationRepository
                .findByFamilyIdAndReceiverIdAndStatus(familyId, userId, "PENDING");
        
        if (existingInvite.isPresent()) {
            System.out.println("⚠️ Thông báo: Đã tồn tại sẵn một lời mời PENDING giữa hai bên. Bỏ qua ghi đè!");
            return true; 
        }

        // 🎯 ĐÃ THAY ĐỔI: Sử dụng khởi tạo 'new' truyền thống thay thế hoàn toàn cho Builder 
        // Điều này đảm bảo các trường của lớp cha BaseEntity (created_at, updated_at) không bị gán null ngầm
        Invitation invitation = new Invitation();
        invitation.setFamilyId(familyId);
        invitation.setReceiverId(userId);
        invitation.setStatus("PENDING"); // Ép cứng chuỗi trạng thái

        // 🎯 ÉP BUỘC ĐỒNG BỘ: Sử dụng saveAndFlush để bắt Hibernate bắn lệnh SQL ngay lập tức, không đợi kết thúc hàm
        Invitation savedInvite = invitationRepository.saveAndFlush(invitation);
        
        System.out.println("🔥 [HOÀN THÀNH SERVICE] Đã ép lưu thành công! Bản ghi ID vừa sinh ra: " + savedInvite.getId());
        return true;
    }
}