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
    private String resumeUrl;
    private String linkedin;
    private String website;
    private String companyName;
    private String companyLocation;
    private String companyWebsite;
    private String department;
    private String phone;
}
