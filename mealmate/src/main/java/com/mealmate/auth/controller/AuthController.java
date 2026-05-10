package com.mealmate.auth.controller;

import com.mealmate.auth.dto.AuthResponse;
import com.mealmate.auth.dto.LoginRequest;
import com.mealmate.auth.dto.RegisterRequest;
import com.mealmate.auth.service.UserAuthService;
import com.mealmate.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserAuthService userAuthService;

    /**
     * POST /api/auth/register
     * Register a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = userAuthService.register(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Đăng ký thành công", response));
    }

    /**
     * POST /api/auth/login
     * Login and receive JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userAuthService.login(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Đăng nhập thành công", response));
    }

}
