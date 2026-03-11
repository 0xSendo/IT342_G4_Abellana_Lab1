package com.internmatch.internmatch.config;

import com.internmatch.internmatch.entity.Role;
import com.internmatch.internmatch.entity.User;
import com.internmatch.internmatch.repository.UserRepository;
import com.internmatch.internmatch.security.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "OAuth2 provider did not return an email address.");
            return;
        }

        if (name == null || name.isBlank()) {
            name = email;
        }

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .name(name)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.STUDENT)
                        .build()));

        if (user.getName() == null || user.getName().isBlank()) {
            user.setName(name);
            user = userRepository.save(user);
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("name", user.getName());
        claims.put("userId", user.getId());

        String token = jwtService.generateToken(claims, user);
        String dashboardPath = resolveDashboardPath(user.getRole());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path(dashboardPath)
                .queryParam("token", token)
                .queryParam("email", user.getEmail())
                .queryParam("name", user.getName())
                .queryParam("role", user.getRole().name())
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private String resolveDashboardPath(Role role) {
        return switch (role) {
            case EMPLOYER -> "/dashboard/employer";
            case ADMIN -> "/dashboard/admin";
            default -> "/dashboard/student";
        };
    }
}
