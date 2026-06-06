package com.mealmate.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long userId;
    private String accessToken;
    private String tokenType;
    private String email;
    private String fullName;
    private String role;
    private String gender;
    private Long familyId;
    private String familyName;
}
