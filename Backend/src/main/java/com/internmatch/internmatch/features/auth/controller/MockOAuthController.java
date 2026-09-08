package com.internmatch.internmatch.features.auth.controller;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.auth.security.JwtService;
import com.internmatch.internmatch.features.auth.security.OAuthCodeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

@Controller
public class MockOAuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final OAuthCodeService oAuthCodeService;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Value("${app.oauth2.mock-enabled:false}")
    private boolean mockEnabled;

    @Value("${app.oauth2.frontend-redirect-url:http://localhost:5173/oauth-callback}")
    private String frontendRedirectUrl;

    public MockOAuthController(UserRepository userRepository, JwtService jwtService, OAuthCodeService oAuthCodeService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.oAuthCodeService = oAuthCodeService;
    }

    /**
     * Opt-in development-only fallback. Disabled by default; must be explicitly
     * enabled with app.oauth2.mock-enabled=true AND must not have a real
     * GOOGLE_CLIENT_ID configured. Never authenticates an existing account that
     * has a password set or a non-STUDENT role.
     */
    @GetMapping("/oauth2/authorization/google")
    public String mockGoogleOauth(HttpServletRequest request) {
        boolean hasRealGoogleClient = googleClientId != null && !googleClientId.isBlank();
        if (!mockEnabled || hasRealGoogleClient) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Not found");
        }

        // Use a dev email; if the user already exists reuse it
        String devEmail = "dev@local.test";
        Optional<User> existing = userRepository.findByEmail(devEmail);

        User user = existing.orElseGet(() -> {
            User u = User.builder()
                    .email(devEmail)
                    .name("Dev Local")
                    .role(Role.STUDENT)
                    .build();
            return userRepository.save(u);
        });

        // Never mint a token for a reusable/privileged account
        if (user.getRole() != Role.STUDENT
                || (user.getPassword() != null && !user.getPassword().isBlank())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Dev account is not usable for mock OAuth");
        }

        String token = jwtService.generateToken(user);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .fragment("token=" + token + "&email=" + user.getEmail() + "&name=" + (user.getName() != null ? user.getName() : "") + "&role=" + user.getRole().name())
                .build()
                .encode()
                .toUriString();

        // Perform a redirect to the frontend callback
        return "redirect:" + redirectUrl;
    }
}
