package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import jakarta.servlet.ServletException;
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
    private final OAuthCodeService oAuthCodeService;

    @Value("${app.oauth2.frontend-redirect-url:http://localhost:5173/oauth-callback}")
    private String frontendRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // New accounts always start as STUDENT; EMPLOYER/ADMIN roles are granted
        // by an administrator only (never self-assigned via a client-supplied value).
        final Role roleToAssign = Role.STUDENT;

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

        // Hand the client a short-lived, single-use code instead of the JWT.
        // The frontend exchanges this code for a token via the backend so that
        // authentication state is never carried in the URL.
        String oauthCode = oAuthCodeService.issueCode(user.getEmail());

        // Build redirect URL with fragment and ensure it is encoded
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .fragment("code=" + oauthCode)
                .build()
                .encode()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}