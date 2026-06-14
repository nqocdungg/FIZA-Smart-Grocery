package com.mealmate.auth.service;

import com.mealmate.auth.dto.AuthResponse;
import com.mealmate.auth.dto.LoginRequest;
import com.mealmate.auth.dto.RegisterRequest;
import com.mealmate.auth.model.Role;
import com.mealmate.user.model.Family;
import com.mealmate.user.model.User;
import com.mealmate.user.repository.FamilyRepository;
import com.mealmate.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserAuthService userAuthService;

    // --- CASE 1: Đăng ký tài khoản (register) ---

    @Test
    void should_RegisterSuccessfully_When_ValidRequest() {
        // given
        RegisterRequest request = new RegisterRequest(
                "li@gmail.com",
                "123456",
                "Li",
                "0123456789",
                "female"
        );

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");

        Role defaultRole = new Role();
        defaultRole.setId(3L);
        defaultRole.setName("HOUSEKEEPER");

        User savedUser = User.builder()
                .id(1L)
                .email("li@gmail.com")
                .passwordHash("hashed_password")
                .fullName("Li")
                .phone("0123456789")
                .gender("FEMALE")
                .role(defaultRole)
                .emailVerified(false)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Family savedFamily = new Family();
        savedFamily.setId(10L);
        savedFamily.setName("Gia đình Li");
        savedFamily.setHousekeeperId(1L);

        when(familyRepository.save(any(Family.class))).thenReturn(savedFamily);
        when(jwtService.generateToken(anyMap(), eq("li@gmail.com"))).thenReturn("jwt_token");

        // when
        AuthResponse response = userAuthService.register(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getAccessToken()).isEqualTo("jwt_token");
        assertThat(response.getEmail()).isEqualTo("li@gmail.com");
        assertThat(response.getFullName()).isEqualTo("Li");
        assertThat(response.getRole()).isEqualTo("HOUSEKEEPER");
        assertThat(response.getGender()).isEqualTo("FEMALE");
        assertThat(response.getFamilyId()).isEqualTo(10L);
        assertThat(response.getFamilyName()).isEqualTo("Gia đình Li");

        verify(userRepository, times(2)).save(any(User.class));
        verify(familyRepository).save(any(Family.class));
    }

    @Test
    void should_ThrowException_When_EmailAlreadyExists() {
        // given
        RegisterRequest request = new RegisterRequest(
                "li@gmail.com",
                "123456",
                "Li",
                "0123456789",
                "female"
        );

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // when / then
        assertThatThrownBy(() -> userAuthService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email đã được sử dụng: li@gmail.com");
    }

    // --- CASE 2: Đăng nhập tài khoản (login) ---

    @Test
    void should_LoginSuccessfully_When_ValidCredentials() {
        // given
        LoginRequest request = new LoginRequest("li@gmail.com", "123456");

        Role role = new Role();
        role.setId(3L);
        role.setName("HOUSEKEEPER");

        Family family = new Family();
        family.setId(10L);
        family.setName("Gia đình Li");

        User user = User.builder()
                .id(1L)
                .email("li@gmail.com")
                .passwordHash("hashed_password")
                .fullName("Li")
                .gender("FEMALE")
                .role(role)
                .family(family)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(anyMap(), eq("li@gmail.com"))).thenReturn("jwt_token");

        // when
        AuthResponse response = userAuthService.login(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getAccessToken()).isEqualTo("jwt_token");
        assertThat(response.getEmail()).isEqualTo("li@gmail.com");
        assertThat(response.getFullName()).isEqualTo("Li");
        assertThat(response.getRole()).isEqualTo("HOUSEKEEPER");
        assertThat(response.getFamilyId()).isEqualTo(10L);
        assertThat(response.getFamilyName()).isEqualTo("Gia đình Li");
    }

    @Test
    void should_ThrowException_When_LoginEmailNotFound() {
        // given
        LoginRequest request = new LoginRequest("wrong@gmail.com", "123456");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        // when / then
        assertThatThrownBy(() -> userAuthService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Email hoặc mật khẩu không đúng");
    }

    @Test
    void should_ThrowException_When_LoginPasswordIncorrect() {
        // given
        LoginRequest request = new LoginRequest("li@gmail.com", "wrong_password");

        User user = User.builder()
                .id(1L)
                .email("li@gmail.com")
                .passwordHash("hashed_password")
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(false);

        // when / then
        assertThatThrownBy(() -> userAuthService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Email hoặc mật khẩu không đúng");
    }
}
