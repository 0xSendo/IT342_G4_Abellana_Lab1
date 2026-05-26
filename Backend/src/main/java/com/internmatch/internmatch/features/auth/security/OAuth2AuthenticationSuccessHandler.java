package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.oauth2.frontend-redirect-url:http://localhost:5173/oauth-callback}")
    private String frontendRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Check for pending role from cookie (set by frontend register page)
        String pendingRole = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("pending_role".equals(cookie.getName())) {
                    pendingRole = cookie.getValue();
                    // Clear cookie
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        final Role roleToAssign = "EMPLOYER".equalsIgnoreCase(pendingRole) ? Role.EMPLOYER : Role.STUDENT;

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .name(name != null ? name : email.split("@")[0])
                            .email(email)
                            .role(roleToAssign)
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtService.generateToken(user);

        // Build redirect URL with fragment and ensure it is encoded
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .fragment("token=" + token +
                        "&email=" + user.getEmail() +
                        "&name=" + (user.getName() != null ? user.getName() : "") +
                        "&role=" + user.getRole().name())
                .build()
                .encode()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}