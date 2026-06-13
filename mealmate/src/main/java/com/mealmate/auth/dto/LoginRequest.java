package com.mealmate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Tài khoản không được để trống")
    private String email; 

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}