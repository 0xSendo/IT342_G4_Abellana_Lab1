package com.internmatch.internmatch.features.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private String role;
    private String program;
    private String yearLevel;
    private String skills;
    private String bio;
    private String projects;
    private String companyName;
}
