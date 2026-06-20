package com.mealmate.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.mealmate.auth.exception.EmailDeliveryException;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService service;

    @Test
    void shouldSavePasswordBeforeSendingEmail() {
        User user = User.builder()
                .id(1L)
                .email("user@gmail.com")
                .passwordHash("old-hash")
                .build();

        when(userRepository.findByEmailOrPhone("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        service.resetPasswordAndSendEmail("user@gmail.com");

        InOrder order = inOrder(userRepository, emailService);
        order.verify(userRepository).saveAndFlush(user);
        order.verify(emailService).sendTemporaryPasswordEmail(
                eq("user@gmail.com"),
                argThat(password -> password != null && password.length() == 8));
        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
    }

    @Test
    void shouldPropagateEmailFailureSoTransactionCanRollback() {
        User user = User.builder()
                .id(1L)
                .email("user@gmail.com")
                .passwordHash("old-hash")
                .build();

        when(userRepository.findByEmailOrPhone("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");
        when(userRepository.saveAndFlush(user)).thenReturn(user);
        doThrow(new EmailDeliveryException("SMTP failed"))
                .when(emailService)
                .sendTemporaryPasswordEmail(eq("user@gmail.com"), anyString());

        assertThatThrownBy(() -> service.resetPasswordAndSendEmail("user@gmail.com"))
                .isInstanceOf(EmailDeliveryException.class)
                .hasMessage("SMTP failed");

        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void resetMethodMustRemainTransactional() throws NoSuchMethodException {
        Transactional transactional = PasswordResetService.class
                .getMethod("resetPasswordAndSendEmail", String.class)
                .getAnnotation(Transactional.class);

        assertThat(transactional).isNotNull();
    }
}
