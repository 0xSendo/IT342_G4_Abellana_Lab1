package com.internmatch.internmatch.features.auth.controller;

import com.internmatch.internmatch.TestSecurityConfig;
import com.internmatch.internmatch.features.auth.*;
import com.internmatch.internmatch.features.auth.security.*;
import com.internmatch.internmatch.features.common.community.ContentModerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AuthController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class))
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = {
        "GOOGLE_CLIENT_ID=test-client-id",
        "spring.test.mockmvc.add-filter=false"
})
@Epic("Authentication Security")
@Feature("Auth API")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private PasswordEncoder passwordEncoder;
    @MockitoBean
    private AuthenticationManager authenticationManager;
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private LoginAttemptService loginAttemptService;
    @MockitoBean
    private RateLimitingService rateLimitingService;
    @MockitoBean
    private PasswordPolicyService passwordPolicyService;
    @MockitoBean
    private ContentModerationService moderationService;
    @MockitoBean
    private UserCleanupService userCleanupService;
    @MockitoBean
    private OAuthCodeService oAuthCodeService;

    @Autowired
    private ObjectMapper objectMapper;

    private User student;
    private User admin;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L).email("alice@internmatch.com").name("Alice")
                .role(Role.STUDENT).tokenVersion(0).build();
        admin = User.builder()
                .id(2L).email("admin@internmatch.com").name("Admin")
                .role(Role.ADMIN).tokenVersion(0).build();
    }

    private void mockAuthenticatedUser(User user) {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Nested
    @Story("Registration")
    class Registration {

        @Test
        @DisplayName("Returns 200 on successful registration")
        void registerSuccess() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(true);
            when(passwordPolicyService.validatePassword(anyString(), anyString())).thenReturn(null);
            when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(1L);
                return u;
            });

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"StrongP@ss1\"}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Returns 429 when rate limited")
        void registerRateLimited() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(false);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"StrongP@ss1\"}"))
                    .andExpect(status().isTooManyRequests());
        }

        @Test
        @DisplayName("Returns 400 on weak password")
        void registerWeakPassword() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(true);
            when(passwordPolicyService.validatePassword(anyString(), anyString()))
                    .thenReturn("Password must be at least 8 characters long");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"short\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @Story("Login")
    class Login {

        @Test
        @DisplayName("Returns 200 with AuthResponse on valid credentials")
        void loginSuccess() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(true);
            when(loginAttemptService.isBlocked(anyString(), anyString())).thenReturn(false);
            when(authenticationManager.authenticate(any()))
                    .thenReturn(new UsernamePasswordAuthenticationToken(student, null));
            when(jwtService.generateToken(any(User.class))).thenReturn("mock-jwt-token");
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"alice@internmatch.com\",\"password\":\"StrongP@ss1\"}")
                            .header("X-Forwarded-For", "127.0.0.1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                    .andExpect(jsonPath("$.email").value("alice@internmatch.com"))
                    .andExpect(jsonPath("$.name").value("Alice"))
                    .andExpect(jsonPath("$.role").value("STUDENT"));
        }

        @Test
        @DisplayName("Returns 401 on invalid credentials")
        void loginInvalidCredentials() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(true);
            when(loginAttemptService.isBlocked(anyString(), anyString())).thenReturn(false);
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad"));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"alice@internmatch.com\",\"password\":\"wrong\"}")
                            .header("X-Forwarded-For", "127.0.0.1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Returns 401 when account is locked")
        void loginAccountLocked() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(true);
            when(loginAttemptService.isBlocked(anyString(), anyString())).thenReturn(true);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"alice@internmatch.com\",\"password\":\"StrongP@ss1\"}")
                            .header("X-Forwarded-For", "127.0.0.1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Returns 429 when rate limited")
        void loginRateLimited() throws Exception {
            when(rateLimitingService.isAllowed(anyString())).thenReturn(false);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"alice@internmatch.com\",\"password\":\"StrongP@ss1\"}"))
                    .andExpect(status().isTooManyRequests());
        }
    }

    @Nested
    @Story("Get Current User")
    class GetMe {

        @Test
        @DisplayName("Returns 200 with user when authenticated")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void meReturnsUser() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));

            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("alice@internmatch.com"))
                    .andExpect(jsonPath("$.name").value("Alice"));
        }

        @Test
        @DisplayName("Returns 401 when unauthenticated")
        void meReturns401WhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @Story("Profile Update")
    class ProfileUpdate {

        @Test
        @DisplayName("Returns 200 with updated user")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void profileUpdateSuccess() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            mockMvc.perform(put("/api/auth/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Alice Updated\",\"bio\":\"New bio\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Alice Updated"));
        }

        @Test
        @DisplayName("Returns 400 on moderation error")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void profileUpdateModerationRejected() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            doThrow(new RuntimeException("MODERATION_ERROR: Profanity detected"))
                    .when(moderationService).validateFields(anyMap(), eq(true));

            mockMvc.perform(put("/api/auth/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"bio\":\"Bad content here\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @Story("Change Password")
    class ChangePassword {

        @Test
        @DisplayName("Returns 200 on successful password change")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void changePasswordSuccess() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(passwordEncoder.matches("OldP@ss1", null)).thenReturn(true);
            when(passwordEncoder.encode("NewP@ss1!")).thenReturn("encoded_new");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            mockMvc.perform(put("/api/auth/change-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"currentPassword\":\"OldP@ss1\",\"newPassword\":\"NewP@ss1!\"}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Returns 400 when current password is wrong")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void changePasswordWrongCurrent() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(passwordEncoder.matches("WrongPass", null)).thenReturn(false);

            mockMvc.perform(put("/api/auth/change-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"currentPassword\":\"WrongPass\",\"newPassword\":\"NewP@ss1!\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @Story("Admin User Management")
    class AdminUserManagement {

        @Test
        @DisplayName("Admin can list all users")
        @WithMockUser(username = "admin@internmatch.com", roles = "ADMIN")
        void adminListsUsers() throws Exception {
            when(userRepository.findAll()).thenReturn(List.of(student, admin));

            mockMvc.perform(get("/api/auth/users"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)));
        }

        @Test
        @DisplayName("Student cannot list users (403)")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void studentCannotListUsers() throws Exception {
            mockMvc.perform(get("/api/auth/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Admin can delete a user")
        @WithMockUser(username = "admin@internmatch.com", roles = "ADMIN")
        void adminDeletesUser() throws Exception {
            when(userRepository.existsById(1L)).thenReturn(true);

            mockMvc.perform(delete("/api/auth/users/1"))
                    .andExpect(status().isOk());
        }
    }
}
