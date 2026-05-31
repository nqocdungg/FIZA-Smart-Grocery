package com.mealmate.user.repository;

import com.mealmate.user.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    
    // Tìm lời mời đang chờ xử lý (PENDING) mới nhất của một người nhận cụ thể
    Optional<Invitation> findFirstByReceiverIdAndStatusOrderByIdDesc(Long receiverId, String status);
    
    // Tìm chính xác lời mời đang chờ giữa một gia đình và một người nhận cụ thể
    Optional<Invitation> findByFamilyIdAndReceiverIdAndStatus(Long familyId, Long receiverId, String status);
}