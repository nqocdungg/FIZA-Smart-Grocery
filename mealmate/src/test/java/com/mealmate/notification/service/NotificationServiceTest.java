package com.mealmate.notification.service;

import com.mealmate.notification.model.Notification;
import com.mealmate.notification.model.NotificationSeverity;
import com.mealmate.notification.model.dto.CreateNotificationRequest;
import com.mealmate.notification.model.dto.NotificationResponse;
import com.mealmate.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    // --- CASE 1: Đẩy thông báo mới (push) ---

    @Test
    void should_PushNotificationSuccessfully_When_ValidRequest() {
        // given
        CreateNotificationRequest req = CreateNotificationRequest.builder()
                .userId(1L)
                .category("FRIDGE")
                .severity(NotificationSeverity.NORMAL)
                .title("Tủ lạnh sắp hết sữa")
                .body("Còn 1 hộp sữa")
                .build();

        // when
        notificationService.push(req);

        // then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void should_PushNotificationInlineSuccessfully_When_ValidParameters() {
        // given
        Long userId = 1L;
        String category = "SHOPPING";
        String severity = NotificationSeverity.NORMAL;
        String title = "Đã đi chợ";
        String body = "Đã hoàn thành đi chợ";

        // when
        notificationService.push(userId, category, severity, title, body);

        // then
        verify(notificationRepository).save(any(Notification.class));
    }

    // --- CASE 2: Truy vấn thông báo (getForUser / hasUnread) ---

    @Test
    void should_GetNotificationsForUser_When_Called() {
        // given
        Long userId = 1L;
        Notification n = Notification.builder()
                .userId(userId)
                .category("MEAL")
                .severity(NotificationSeverity.NORMAL)
                .title("Lập kế hoạch ăn uống")
                .body("Đã lập bữa tối")
                .read(false)
                .build();
        n.setId(100L);
        n.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findTop60ByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(n));

        // when
        List<NotificationResponse> responses = notificationService.getForUser(userId);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(100L);
        assertThat(responses.get(0).getCategory()).isEqualTo("MEAL");
        assertThat(responses.get(0).isRead()).isFalse();
    }

    @Test
    void should_ReturnTrue_When_HasUnreadNotifications() {
        // given
        Long userId = 1L;
        when(notificationRepository.existsByUserIdAndReadFalse(userId)).thenReturn(true);

        // when
        boolean hasUnread = notificationService.hasUnread(userId);

        // then
        assertThat(hasUnread).isTrue();
    }

    // --- CASE 3: Đánh dấu đã đọc (markAllRead / markOneRead) ---

    @Test
    void should_MarkAllNotificationsAsRead_When_Called() {
        // given
        Long userId = 1L;

        // when
        notificationService.markAllRead(userId);

        // then
        verify(notificationRepository).markAllReadByUserId(userId);
    }

    @Test
    void should_MarkOneNotificationAsRead_When_NotificationBelongsToUser() {
        // given
        Long notificationId = 100L;
        Long userId = 1L;
        Notification n = Notification.builder()
                .userId(userId)
                .category("SYSTEM")
                .title("Hệ thống bảo trì")
                .read(false)
                .build();

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(n));

        // when
        notificationService.markOneRead(notificationId, userId);

        // then
        assertThat(n.isRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    void should_NotMarkNotificationAsRead_When_NotificationBelongsToAnotherUser() {
        // given
        Long notificationId = 100L;
        Long userId = 1L;
        Notification n = Notification.builder()
                .userId(999L) // Another user
                .category("SYSTEM")
                .title("Hệ thống bảo trì")
                .read(false)
                .build();

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(n));

        // when
        notificationService.markOneRead(notificationId, userId);

        // then
        assertThat(n.isRead()).isFalse();
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
