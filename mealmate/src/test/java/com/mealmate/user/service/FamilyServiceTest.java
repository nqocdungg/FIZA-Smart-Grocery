package com.mealmate.user.service;

import com.mealmate.notification.service.NotificationService;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.Invitation;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.InvitationRepository;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FamilyServiceTest {

    @Mock
    private FamilyRepository repository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private InvitationRepository invitationRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FamilyService service;

    @Test
    void should_FindAllFamilies_When_Called() {
        // given
        Family f1 = new Family();
        f1.setName("Family A");
        Family f2 = new Family();
        f2.setName("Family B");

        when(repository.findAll()).thenReturn(List.of(f1, f2));

        // when
        List<Family> result = service.findAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Family A");
    }

    @Test
    void should_SaveFamily_When_ValidFamily() {
        // given
        Family f = new Family();
        f.setName("New Family");

        Family saved = new Family();
        saved.setId(1L);
        saved.setName("New Family");

        when(repository.save(f)).thenReturn(saved);

        // when
        Family result = service.save(f);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void should_FindFamilyById_When_Exists() {
        // given
        Long familyId = 1L;
        Family f = new Family();
        f.setId(familyId);

        when(repository.findById(familyId)).thenReturn(Optional.of(f));

        // when
        Family result = service.findByFamilyId(familyId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(familyId);
    }

    @Test
    void should_ThrowException_When_FamilyIdNull() {
        // given
        Long familyId = null;

        // when & then
        assertThatThrownBy(() -> service.findByFamilyId(familyId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Người dùng chưa tham gia vào bất kỳ nhóm gia đình nào!");
    }

    @Test
    void should_InviteMember_When_UserBelongsToNoFamily() {
        // given
        Long familyId = 1L;
        Long userId = 2L;

        User user = new User();
        user.setId(userId);
        user.setFamily(null); // No family

        Family family = new Family();
        family.setId(familyId);
        family.setName("Gia đình vui vẻ");
        family.setHousekeeperId(10L);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(repository.findById(familyId)).thenReturn(Optional.of(family));
        when(invitationRepository.findByFamilyIdAndReceiverIdAndStatus(familyId, userId, "PENDING"))
                .thenReturn(Optional.empty());

        // when
        boolean success = service.inviteMemberToFamily(familyId, userId);

        // then
        assertThat(success).isTrue();
        verify(invitationRepository).saveAndFlush(any(Invitation.class));
    }

    @Test
    void should_DeclineInviteAutomatically_When_UserIsOrdinaryMemberOfAnotherFamily() {
        // given
        Long familyId = 1L;
        Long userId = 2L;

        com.mealmate.auth.model.Role role = new com.mealmate.auth.model.Role();
        role.setId(2L); // Ordinary Member

        Family otherFamily = new Family();
        otherFamily.setId(99L);

        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setFamily(otherFamily);

        Family family = new Family();
        family.setId(familyId);
        family.setName("Gia đình A");
        family.setHousekeeperId(10L);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(repository.findById(familyId)).thenReturn(Optional.of(family));
        when(invitationRepository.findByFamilyIdAndReceiverIdAndStatus(familyId, userId, "DECLINED"))
                .thenReturn(Optional.empty());

        // when
        boolean success = service.inviteMemberToFamily(familyId, userId);

        // then
        assertThat(success).isFalse(); // Blocked member
        verify(notificationService, times(2)).push(any(), any(), any(), any(), any());
        verify(invitationRepository).saveAndFlush(any(Invitation.class));
    }
}
