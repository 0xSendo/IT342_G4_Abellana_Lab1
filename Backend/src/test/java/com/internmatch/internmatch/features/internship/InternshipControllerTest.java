package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.TestSecurityConfig;
import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.auth.security.JwtAuthenticationFilter;
import com.internmatch.internmatch.features.internship.dto.CreateInternshipRequest;
import com.internmatch.internmatch.features.internship.dto.InternshipResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = InternshipController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class))
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = "spring.test.mockmvc.add-filter=false")
@Epic("Internship Management")
@Feature("Internship API")
class InternshipControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InternshipService internshipService;
    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private PasswordEncoder passwordEncoder;

    private User employer;
    private InternshipResponse activeInternship;

    @BeforeEach
    void setUp() {
        employer = User.builder()
                .id(1L).email("hr@acme.com").name("ACME HR").role(Role.EMPLOYER).tokenVersion(0).build();

        activeInternship = InternshipResponse.builder()
                .id(1L)
                .title("Software Engineering Intern")
                .description("Build features.")
                .company("ACME Corp")
                .location("Manila")
                .setup("Hybrid")
                .status(InternshipStatus.ACTIVE)
                .startDate(LocalDate.now().plusMonths(1))
                .endDate(LocalDate.now().plusMonths(4))
                .postedByUserId(1L)
                .postedByEmail("hr@acme.com")
                .postedByName("ACME HR")
                .createdAt(LocalDate.now())
                .updatedAt(LocalDate.now())
                .applicantsList(List.of())
                .build();
    }

    private String validRequestJson() {
        return "{"
                + "\"title\":\"Software Engineering Intern\","
                + "\"description\":\"Build features end to end.\","
                + "\"company\":\"ACME Corp\","
                + "\"location\":\"Manila\","
                + "\"setup\":\"Hybrid\","
                + "\"startDate\":\"" + LocalDate.now().plusMonths(1) + "\","
                + "\"endDate\":\"" + LocalDate.now().plusMonths(4) + "\","
                + "\"status\":\"ACTIVE\""
                + "}";
    }

    @Nested
    @Story("Public Listing")
    class PublicListing {

        @Test
        @DisplayName("GET /api/internships/active returns 200 without auth")
        void activeInternshipsPublic() throws Exception {
            when(internshipService.getAllActiveInternships()).thenReturn(List.of(activeInternship));

            mockMvc.perform(get("/api/internships/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].title").value("Software Engineering Intern"));
        }
    }

    @Nested
    @Story("Create Internship")
    class CreateInternship {

        @Test
        @DisplayName("Employer can create an internship (201)")
        @WithMockUser(username = "hr@acme.com", roles = "EMPLOYER")
        void employerCreatesInternship() throws Exception {
            when(internshipService.createInternship(any(CreateInternshipRequest.class), eq("hr@acme.com")))
                    .thenReturn(activeInternship);

            mockMvc.perform(post("/api/internships")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.title").value("Software Engineering Intern"));
        }

        @Test
        @DisplayName("Student cannot create an internship (403)")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void studentCannotCreateInternship() throws Exception {
            mockMvc.perform(post("/api/internships")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson()))
                    .andExpect(status().isForbidden());
            verify(internshipService, never()).createInternship(any(), any());
        }

        @Test
        @DisplayName("Returns 400 on moderation error")
        @WithMockUser(username = "hr@acme.com", roles = "EMPLOYER")
        void moderationErrorReturns400() throws Exception {
            when(internshipService.createInternship(any(CreateInternshipRequest.class), eq("hr@acme.com")))
                    .thenThrow(new RuntimeException("MODERATION_ERROR: Inappropriate content"));

            mockMvc.perform(post("/api/internships")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @Story("Get Internship")
    class GetInternship {

        @Test
        @DisplayName("Returns 200 for valid internship")
        @WithMockUser(username = "alice@internmatch.com", roles = "STUDENT")
        void getInternshipById() throws Exception {
            when(internshipService.getInternshipById(1L, "alice@internmatch.com"))
                    .thenReturn(activeInternship);

            mockMvc.perform(get("/api/internships/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));
        }
    }

    @Nested
    @Story("Update Internship")
    class UpdateInternship {

        @Test
        @DisplayName("Owner can update their internship (200)")
        @WithMockUser(username = "hr@acme.com", roles = "EMPLOYER")
        void ownerUpdates() throws Exception {
            when(internshipService.updateInternship(eq(1L), any(CreateInternshipRequest.class), eq("hr@acme.com")))
                    .thenReturn(activeInternship);

            mockMvc.perform(put("/api/internships/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson()))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @Story("Delete Internship")
    class DeleteInternship {

        @Test
        @DisplayName("Owner can delete their internship (204)")
        @WithMockUser(username = "hr@acme.com", roles = "EMPLOYER")
        void ownerDeletes() throws Exception {
            doNothing().when(internshipService).deleteInternship(1L, "hr@acme.com");

            mockMvc.perform(delete("/api/internships/1"))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @Story("My Postings")
    class MyPostings {

        @Test
        @DisplayName("Employer can get their own postings")
        @WithMockUser(username = "hr@acme.com", roles = "EMPLOYER")
        void employerGetsMyPostings() throws Exception {
            when(internshipService.getUserByEmail("hr@acme.com")).thenReturn(employer);
            when(internshipService.getInternshipsByPostedUser(1L)).thenReturn(List.of(activeInternship));

            mockMvc.perform(get("/api/internships/my-postings"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }
    }

    @Nested
    @Story("Search")
    class Search {

        @Test
        @DisplayName("Search by company returns results")
        @WithMockUser
        void searchByCompany() throws Exception {
            when(internshipService.searchByCompany(eq("ACME"), any())).thenReturn(List.of(activeInternship));

            mockMvc.perform(get("/api/internships/search/company")
                            .param("company", "ACME"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @DisplayName("Search by location returns results")
        @WithMockUser
        void searchByLocation() throws Exception {
            when(internshipService.searchByLocation(eq("Manila"), any())).thenReturn(List.of(activeInternship));

            mockMvc.perform(get("/api/internships/search/location")
                            .param("location", "Manila"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }
    }
}