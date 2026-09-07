package com.internmatch.internmatch.features.auth.controller;

import com.internmatch.internmatch.features.auth.*;
import com.internmatch.internmatch.features.auth.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final com.internmatch.internmatch.features.auth.security.LoginAttemptService loginAttemptService;
    private final com.internmatch.internmatch.features.auth.security.RateLimitingService rateLimitingService;
    private final com.internmatch.internmatch.features.common.community.ContentModerationService moderationService;
    private final jakarta.servlet.http.HttpServletRequest httpServletRequest;
    @org.springframework.beans.factory.annotation.Value("${GOOGLE_CLIENT_ID}")
    private String googleClientId;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        String clientIp = resolveClientIp();
        if (!rateLimitingService.isAllowed(clientIp)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body("Too many registration attempts. Please try again later.");
        }

        String passwordError = validatePassword(request.getPassword(), request.getEmail());
        if (passwordError != null) {
            return ResponseEntity.badRequest().body(passwordError);
        }
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .failedLoginAttempts(0)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String clientIp = resolveClientIp();
        if (!rateLimitingService.isAllowed(clientIp)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body("Too many login attempts. Please try again later.");
        }

        if (loginAttemptService.isBlocked(request.getEmail(), clientIp)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid credentials.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            loginAttemptService.loginSucceeded(request.getEmail(), clientIp);
            String token = jwtService.generateToken(user);

            return ResponseEntity.ok(buildAuthResponse(user, token));
        } catch (org.springframework.security.core.AuthenticationException e) {
            loginAttemptService.loginFailed(request.getEmail(), clientIp);
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid credentials.");
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        String clientIp = resolveClientIp();
        if (!rateLimitingService.isAllowed(clientIp)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body("Too many attempts. Please try again later.");
        }

        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid Google token");
        }

        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        try {
            java.util.Map<String, Object> payload = restTemplate.getForObject(url, java.util.Map.class);
            if (payload == null || payload.containsKey("error") || !isValidGoogleToken(payload)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid Google token");
            }

            String email = (String) payload.get("email");
            String name = (String) payload.get("name");

            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .name(name != null ? name : email.split("@")[0])
                                .email(email)
                                .role(Role.STUDENT)
                                .failedLoginAttempts(0)
                                .build();
                        return userRepository.save(newUser);
                    });

            String token = jwtService.generateToken(user);

            return ResponseEntity.ok(buildAuthResponse(user, token));
        } catch (Exception e) {
            log.error("Google token validation failed", e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid Google token");
        }
    }

    private boolean isValidGoogleToken(java.util.Map<String, Object> payload) {
        Object aud = payload.get("aud");
        if (aud == null || !googleClientId.equals(String.valueOf(aud))) {
            return false;
        }
        Object iss = payload.get("iss");
        boolean correctIssuer = "accounts.google.com".equals(iss) || "https://accounts.google.com".equals(iss);
        if (!correctIssuer) {
            return false;
        }
        if (!Boolean.parseBoolean(String.valueOf(payload.get("email_verified")))) {
            return false;
        }
        try {
            long exp = Long.parseLong(String.valueOf(payload.get("exp")));
            if (System.currentTimeMillis() / 1000L >= exp) {
                return false;
            }
        } catch (NumberFormatException e) {
            return false;
        }
        Object email = payload.get("email");
        return email != null && !String.valueOf(email).isBlank();
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @org.springframework.web.bind.annotation.PutMapping("/profile")
    public ResponseEntity<?> updateProfile(org.springframework.security.core.Authentication authentication, @RequestBody java.util.Map<String, Object> profileData) {
        if (authentication == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // MODERATION: Moderate all incoming profile text fields - Allow links in professional profiles
        try {
            moderationService.validateFields(profileData, true);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("MODERATION_ERROR")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
            }
            throw e;
        }
        
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
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User access terminated");
    }

    @org.springframework.web.bind.annotation.PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            org.springframework.security.core.Authentication authentication,
            @RequestBody java.util.Map<String, String> body) {
        if (authentication == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String current = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (current == null || newPassword == null || current.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Current password and new password are required");
        }
        if (current.equals(newPassword)) {
            return ResponseEntity.badRequest().body("New password must be different from the current password");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(current, user.getPassword())) {
            return ResponseEntity.badRequest().body("Current password is incorrect");
        }

        String passwordError = validatePassword(newPassword, user.getEmail());
        if (passwordError != null) {
            return ResponseEntity.badRequest().body(passwordError);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        log.info("Password changed for user {}", user.getEmail());
        return ResponseEntity.ok("Password updated successfully");
    }

    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 64) {
            return false;
        }
        java.util.List<String> commonPasswords = java.util.Arrays.asList(
                "password", "password1", "internmatch", "internmatch1", "12345678",
                "123456789", "qwerty123", "changeme", "admin123", "letmein");
        return !commonPasswords.contains(password.toLowerCase());
    }

    private String validatePassword(String password, String email) {
        if (password == null || password.isEmpty()) {
            return "Password is required";
        }
        if (password.length() < 8) {
            return "Password must be at least 8 characters long";
        }
        if (password.length() > 64) {
            return "Password must be at most 64 characters long";
        }
        String lower = password.toLowerCase();
        if (!isValidPassword(password)) {
            return "Password is too weak. Choose a longer, less common password.";
        }
        if (email != null && !email.isBlank()) {
            String local = email.split("@")[0].toLowerCase();
            if (lower.contains(local) || lower.contains(email.toLowerCase())) {
                return "Password must not contain your email address";
            }
        }
        return null;
    }

    private String resolveClientIp() {
        String forwarded = httpServletRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        return httpServletRequest.getRemoteAddr();
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
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
                .build();
    }
}
