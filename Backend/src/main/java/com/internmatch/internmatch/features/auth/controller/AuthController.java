package com.internmatch.internmatch.features.auth.controller;

import com.internmatch.internmatch.features.auth.*;
import com.internmatch.internmatch.features.auth.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required");
        }
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.STUDENT)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .program(user.getProgram())
                .yearLevel(user.getYearLevel())
                .skills(user.getSkills())
                .bio(user.getBio())
                .projects(user.getProjects())
                .resumeUrl(user.getResumeUrl())
                .linkedin(user.getLinkedin())
                .website(user.getWebsite())
                .companyName(user.getCompanyName())
                .companyLocation(user.getCompanyLocation())
                .companyWebsite(user.getCompanyWebsite())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .build());
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @org.springframework.web.bind.annotation.PutMapping("/profile")
    public ResponseEntity<?> updateProfile(org.springframework.security.core.Authentication authentication, @RequestBody java.util.Map<String, Object> profileData) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (profileData.containsKey("name")) user.setName((String) profileData.get("name"));
        if (profileData.containsKey("program")) user.setProgram((String) profileData.get("program"));
        if (profileData.containsKey("yearLevel")) user.setYearLevel((String) profileData.get("yearLevel"));
        if (profileData.containsKey("skills")) user.setSkills((String) profileData.get("skills"));
        if (profileData.containsKey("bio")) user.setBio((String) profileData.get("bio"));
        if (profileData.containsKey("projects")) user.setProjects((String) profileData.get("projects"));
        if (profileData.containsKey("resumeUrl")) user.setResumeUrl((String) profileData.get("resumeUrl"));
        if (profileData.containsKey("linkedin")) user.setLinkedin((String) profileData.get("linkedin"));
        if (profileData.containsKey("website")) user.setWebsite((String) profileData.get("website"));
        if (profileData.containsKey("companyName")) user.setCompanyName((String) profileData.get("companyName"));
        if (profileData.containsKey("companyLocation")) user.setCompanyLocation((String) profileData.get("companyLocation"));
        if (profileData.containsKey("companyWebsite")) user.setCompanyWebsite((String) profileData.get("companyWebsite"));
        if (profileData.containsKey("department")) user.setDepartment((String) profileData.get("department"));
        if (profileData.containsKey("phone")) user.setPhone((String) profileData.get("phone"));
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @org.springframework.web.bind.annotation.GetMapping("/users")
    public ResponseEntity<java.util.List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
