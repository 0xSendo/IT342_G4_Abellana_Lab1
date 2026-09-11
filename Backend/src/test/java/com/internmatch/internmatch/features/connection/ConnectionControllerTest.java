package com.internmatch.internmatch.features.connection;

import com.internmatch.internmatch.TestSecurityConfig;
import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.auth.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ConnectionController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class))
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = "spring.test.mockmvc.add-filter=false")
@Epic("Networking")
@Feature("Connection API")
class ConnectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ConnectionService connectionService;
    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private PasswordEncoder passwordEncoder;

    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L).email("alice@internmatch.com").name("Alice").role(Role.STUDENT).tokenVersion(0).build();
        otherStudent = User.builder()
                .id(2L).email("bob@internmatch.com").name("Bob").role(Role.STUDENT).tokenVersion(0).build();
    }

    private Connection pendingConnection() {
        return Connection.builder()
                .id(10L)
                .requester(student)
                .receiver(otherStudent)
                .status(ConnectionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Connection acceptedConnection() {
        return Connection.builder()
                .id(10L)
                .requester(student)
                .receiver(otherStudent)
                .status(ConnectionStatus.ACCEPTED)
                .createdAt(LocalDateTime.now())
                .respondedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @Story("Send Request")
    class SendRequest {

        @Test
        @DisplayName("Authenticated user can send a connection request")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void sendRequestSuccess() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(connectionService.sendRequest(1L, 2L)).thenReturn(pendingConnection());

            mockMvc.perform(post("/api/connections/request/2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        @DisplayName("Returns 400 when connection already exists")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void sendRequestDuplicate() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(connectionService.sendRequest(1L, 2L))
                    .thenThrow(new ConnectionException("Connection request already exists"));

            mockMvc.perform(post("/api/connections/request/2"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Unauthenticated user gets 401")
        void unauthenticatedReturns401() throws Exception {
            mockMvc.perform(post("/api/connections/request/2"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @Story("Respond to Request")
    class RespondToRequest {

        @Test
        @DisplayName("Receiver can accept a connection request")
        @WithMockUser(username = "bob@internmatch.com", roles = "STUDENT")
        void acceptRequest() throws Exception {
            when(userRepository.findByEmail("bob@internmatch.com")).thenReturn(Optional.of(otherStudent));
            when(connectionService.respondToRequest(10L, 2L, ConnectionStatus.ACCEPTED))
                    .thenReturn(acceptedConnection());

            mockMvc.perform(put("/api/connections/respond/10")
                            .param("status", "ACCEPTED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACCEPTED"));
        }

        @Test
        @DisplayName("Non-receiver gets error")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void nonReceiverCannotRespond() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(connectionService.respondToRequest(10L, 1L, ConnectionStatus.ACCEPTED))
                    .thenThrow(new ConnectionException("Unauthorized to respond"));

            mockMvc.perform(put("/api/connections/respond/10")
                            .param("status", "ACCEPTED"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @Story("Get Pending")
    class GetPending {

        @Test
        @DisplayName("Returns pending requests list")
        @WithMockUser(username = "bob@internmatch.com", roles = "STUDENT")
        void getPending() throws Exception {
            when(userRepository.findByEmail("bob@internmatch.com")).thenReturn(Optional.of(otherStudent));
            when(connectionService.getPendingRequests(2L)).thenReturn(List.of(pendingConnection()));

            mockMvc.perform(get("/api/connections/pending"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }
    }

    @Nested
    @Story("Get Friends")
    class GetFriends {

        @Test
        @DisplayName("Returns friends list")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void getFriends() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(connectionService.getFriends(1L)).thenReturn(List.of(otherStudent));

            mockMvc.perform(get("/api/connections/friends"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].name").value("Bob"));
        }
    }

    @Nested
    @Story("Get Connection Status")
    class GetStatus {

        @Test
        @DisplayName("Returns connection status")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void getStatus() throws Exception {
            when(userRepository.findByEmail("alice@internmatch.com")).thenReturn(Optional.of(student));
            when(connectionService.getConnectionStatus(1L, 2L)).thenReturn("ACCEPTED");

            mockMvc.perform(get("/api/connections/status/2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACCEPTED"));
        }
    }
}
