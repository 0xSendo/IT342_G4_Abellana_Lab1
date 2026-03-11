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
        return ResponseEntity.ok(new LoginResponse(token, user.getEmail(), user.getName(), user.getRole().name()));
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

        public LoginResponse(String token, String email, String name, String role) {
            this.token = token; this.email = email; this.name = name; this.role = role;
        }

        public String getToken() { return token; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getRole() { return role; }
    }
}
