package com.mealmate.auth.service;

import com.mealmate.auth.dto.AuthResponse;
import com.mealmate.auth.dto.LoginRequest;
import com.mealmate.auth.dto.RegisterRequest;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    /**
     * Register a new user.
     * - Check email uniqueness
     * - BCrypt encode password
     * - Generate verification token
     * - Send verification email
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng: " + request.getEmail());
        }

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();

        // Build and save user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        User savedUser = userRepository.save(user);

        // Send verification email
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationToken);

        log.info("User registered successfully: {}", savedUser.getEmail());

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .tokenType("Bearer")
                .build();
    }

    /**
     * Verify email with the given token.
     */
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token xác thực không hợp lệ"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token xác thực đã hết hạn. Vui lòng đăng ký lại.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        log.info("Email verified successfully for: {}", user.getEmail());
    }

    /**
     * Login user.
     * - Check email exists
     * - Verify password
     * - Generate JWT with custom claims
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }

        // Build custom claims
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("fullName", user.getFullName());
        claims.put("email", user.getEmail());

        String token = jwtService.generateToken(claims, user.getEmail());

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .userId(user.getId())
                .accessToken(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }
}
