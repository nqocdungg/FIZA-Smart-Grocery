package com.mealmate.auth.service;

import com.mealmate.auth.dto.AuthResponse;
import com.mealmate.auth.dto.RegisterRequest;
import com.mealmate.auth.dto.LoginRequest;
import com.mealmate.auth.model.Role;
import com.mealmate.user.model.User;
import com.mealmate.user.model.Family;
import com.mealmate.user.repository.UserRepository;
import com.mealmate.user.repository.FamilyRepository; // 1. Tiêm thêm Repository để thao tác bảng gia đình
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAuthService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository; // 2. Khai báo Bean repository gia đình
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Register a new user.
     * - Check email uniqueness
     * - BCrypt encode password
     * - Set Default Role_Id = 3 (Người nội trợ)
     * - Auto create default Family and link familyId
     */
    @Transactional // 🎯 Giữ tính toàn vẹn dữ liệu, lỗi bất kỳ bước nào sẽ rollback sạch DB
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng: " + request.getEmail());
        }
        
        String finalGender = "OTHER";
        if (request.getGender() != null && !request.getGender().isBlank()) {
            finalGender = request.getGender().toUpperCase(); // Biến đổi thành 'MALE', 'FEMALE', 'OTHER'
        }

        // 3. THAY ĐỔI MẶC ĐỊNH: Set role_id = 3 (Người nội trợ) cho tài khoản đăng ký mới
        Role defaultRole = new Role();
        defaultRole.setId(3L);
        defaultRole.setName("HOUSEKEEPER"); // Hoặc giữ "CUSTOMER" tùy tên cấu hình trong bảng roles của nhóm bạn

        // Bước A: Build và lưu tạm thông tin User xuống DB để lấy ID tự tăng sinh ra
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .gender(finalGender)
                .role(defaultRole) 
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // =========================================================================
        // Bước B: TỰ ĐỘNG TẠO BẢN GHI GIA ĐÌNH MẶC ĐỊNH MỚI
        // =========================================================================
        Family newFamily = new Family();
        // Thiết lập tên theo mẫu: Gia đình + Tên người đăng ký
        newFamily.setName("Gia đình " + savedUser.getFullName());
        // Set housekeeperId bằng chính mã ID user vừa sinh ra ở Bước A
        newFamily.setHousekeeperId(savedUser.getId());

        // Lưu xuống Database -> Hibernate tự cấp mã ID nhóm mới tinh
        newFamily = familyRepository.save(newFamily);

        // =========================================================================
        // Bước C: CẬP NHẬT GÁN NGƯỢC FAMILY_ID CHO USER VÀ SINH TOKEN TRẢ VỀ
        // =========================================================================
        savedUser.setFamilyId(newFamily.getId());
        userRepository.save(savedUser); // Ghi đè cập nhật lại cột family_id trong DB

        log.info("User registered and created family successfully: {}", savedUser.getEmail());

        // Tạo custom claims sinh JWT Token luôn để sau khi đăng ký thành công, Frontend lưu token vào thẳng app chạy luôn
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", savedUser.getId());
        claims.put("fullName", savedUser.getFullName());
        claims.put("email", savedUser.getEmail());
        claims.put("gender", savedUser.getGender() != null ? savedUser.getGender() : "OTHER"); // 🎯 BỔ SUNG: Nạp vào Token khi Đăng ký
        claims.put("role", savedUser.getRole() != null ? savedUser.getRole().getName() : "HOUSEKEEPER");

        String token = jwtService.generateToken(claims, savedUser.getEmail());

        // Trả dữ liệu về khớp hoàn toàn cấu trúc DTO AuthResponse ban đầu
        return AuthResponse.builder()
                .userId(savedUser.getId())
                .accessToken(token) // Đút mã token động vào đây
                .tokenType("Bearer")
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole() != null ? savedUser.getRole().getName() : "HOUSEKEEPER")
                .gender(savedUser.getGender() != null ? savedUser.getGender() : "OTHER") // 🎯 BỔ SUNG: Trả về cho Front-end khi Đăng ký
                .build();
    }

    /**
     * Login user.
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("fullName", user.getFullName());
        claims.put("email", user.getEmail());
        claims.put("gender", user.getGender() != null ? user.getGender() : "OTHER"); // 🎯 BỔ SUNG: Nạp vào Token khi Đăng nhập
        claims.put("role", user.getRole() != null ? user.getRole().getName() : "CUSTOMER");

        String token = jwtService.generateToken(claims, user.getEmail());

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .userId(user.getId())
                .accessToken(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().getName() : "CUSTOMER")
                .gender(user.getGender() != null ? user.getGender() : "OTHER") // 🎯 BỔ SUNG: Trả về cho Front-end khi Đăng nhập
                .build();
    }
}