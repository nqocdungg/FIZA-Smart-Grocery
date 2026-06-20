package com.mealmate.auth.service;

import java.security.SecureRandom;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mealmate.common.exception.ResourceNotFoundException;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final String PASSWORD_CHARACTERS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TEMPORARY_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void resetPasswordAndSendEmail(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Email hoặc Số điện thoại!");
        }

        User user = userRepository.findByEmailOrPhone(keyword.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tài khoản không tồn tại trên hệ thống Fiza!"));

        String temporaryPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));

        // Detect database errors before sending an email. SMTP errors still
        // propagate and roll this transaction back.
        userRepository.saveAndFlush(user);
        emailService.sendTemporaryPasswordEmail(user.getEmail(), temporaryPassword);
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMPORARY_PASSWORD_LENGTH);
        while (password.length() < TEMPORARY_PASSWORD_LENGTH) {
            password.append(PASSWORD_CHARACTERS.charAt(
                    secureRandom.nextInt(PASSWORD_CHARACTERS.length())));
        }
        return password.toString();
    }
}
