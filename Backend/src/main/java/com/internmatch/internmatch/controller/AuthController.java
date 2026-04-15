package com.internmatch.internmatch.controller;

import com.internmatch.internmatch.entity.User;
import com.internmatch.internmatch.entity.Role;
import com.internmatch.internmatch.repository.UserRepository;
import com.internmatch.internmatch.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        Role role = Role.STUDENT;
        if (request.getRole() != null) {
            try { role = Role.valueOf(request.getRole().toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> optUser = userRepository.findByEmail(request.getEmail());
        if (optUser.isEmpty() || !passwordEncoder.matches(request.getPassword(), optUser.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        User user = optUser.get();
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("name", user.getName());
        claims.put("userId", user.getId());

        String token = jwtService.generateToken(claims, user);
        return ResponseEntity.ok(LoginResponse.from(user, token));
    }

    // ---- DTOs ----

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private final String token;
        private final String email;
        private final String name;
        private final String role;
        private final String program;
        private final String yearLevel;
        private final String skills;
        private final String companyName;
        private final String companyLocation;
        private final String companyWebsite;
        private final String department;
        private final String phone;

        public LoginResponse(
                String token,
                String email,
                String name,
                String role,
                String program,
                String yearLevel,
                String skills,
                String companyName,
                String companyLocation,
                String companyWebsite,
                String department,
                String phone
        ) {
            this.token = token;
            this.email = email;
            this.name = name;
            this.role = role;
            this.program = program;
            this.yearLevel = yearLevel;
            this.skills = skills;
            this.companyName = companyName;
            this.companyLocation = companyLocation;
            this.companyWebsite = companyWebsite;
            this.department = department;
            this.phone = phone;
        }

        public static LoginResponse from(User user, String token) {
            return new LoginResponse(
                    token,
                    user.getEmail(),
                    user.getName(),
                    user.getRole().name(),
                    user.getProgram(),
                    user.getYearLevel(),
                    user.getSkills(),
                    user.getCompanyName(),
                    user.getCompanyLocation(),
                    user.getCompanyWebsite(),
                    user.getDepartment(),
                    user.getPhone()
            );
        }

        public String getToken() { return token; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getRole() { return role; }
        public String getProgram() { return program; }
        public String getYearLevel() { return yearLevel; }
        public String getSkills() { return skills; }
        public String getCompanyName() { return companyName; }
        public String getCompanyLocation() { return companyLocation; }
        public String getCompanyWebsite() { return companyWebsite; }
        public String getDepartment() { return department; }
        public String getPhone() { return phone; }
    }
}
