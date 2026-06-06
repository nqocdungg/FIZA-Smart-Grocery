package com.mealmate.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMemberResponse {
    private Long id;
    private String fullName;
    private String email;
    private Long roleId;
    private String roleName;
    private Long familyId;
    private String avatarUrl;
}
