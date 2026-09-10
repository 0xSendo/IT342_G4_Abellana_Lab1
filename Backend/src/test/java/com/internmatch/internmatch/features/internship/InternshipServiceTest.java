package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.common.community.ContentModerationService;
import com.internmatch.internmatch.features.internship.dto.CreateInternshipRequest;
import com.internmatch.internmatch.features.internship.dto.InternshipResponse;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Internship Management")
@Feature("Internship Posting Lifecycle")
class InternshipServiceTest {

    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationRepository applicationRepository;

    private InternshipService service;

    private User employer;
    private User otherEmployer;
    private User student;

    @BeforeEach
    void setUp() {
        service = new InternshipService(
                internshipRepository, userRepository, applicationRepository, new ContentModerationService());

        employer = User.builder()
                .id(1L).email("hr@acme.com").name("ACME HR").role(Role.EMPLOYER).tokenVersion(0).build();
        otherEmployer = User.builder()
                .id(2L).email("hr@globex.com").name("Globex HR").role(Role.EMPLOYER).tokenVersion(0).build();
        student = User.builder()
                .id(3L).email("stud@internmatch.com").name("Stud").role(Role.STUDENT).tokenVersion(0).build();
    }

    private CreateInternshipRequest validRequest(InternshipStatus status) {
        return CreateInternshipRequest.builder()
                .title("Software Engineering Intern")
                .description("Work on real features with our platform team. See https://acme.com/careers for culture.")
                .company("ACME Corp")
                .location("Manila")
                .setup("Hybrid")
                .startDate(LocalDate.now().plusMonths(1))
                .endDate(LocalDate.now().plusMonths(4))
                .status(status)
                .build();
    }

    private Internship internship(User postedBy, InternshipStatus status, Long id) {
        return Internship.builder()
                .id(id)
                .title("Software Engineering Intern")
                .description("Build features end to end.")
                .company("ACME Corp")
                .location("Manila")
                .setup("Hybrid")
                .status(status)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(3))
                .postedBy(postedBy)
                .build();
    }

    @Test
    @DisplayName("Employer can create an active internship")
    void createInternship() {
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(inv -> {
            Internship i = inv.getArgument(0);
            i.setId(10L);
            return i;
        });

        InternshipResponse result = service.createInternship(validRequest(InternshipStatus.ACTIVE), "hr@acme.com");

        assertEquals(10L, result.getId());
        assertEquals("Software Engineering Intern", result.getTitle());
        assertEquals(InternshipStatus.ACTIVE, result.getStatus());
        assertEquals(employer.getId(), result.getPostedByUserId());
    }

    @Test
    @DisplayName("Profane internship title is rejected by moderation")
    void profaneTitleRejected() {
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        CreateInternshipRequest request = validRequest(InternshipStatus.ACTIVE);
        request.setTitle("Shit internship for losers");

        assertThrows(RuntimeException.class, () -> service.createInternship(request, "hr@acme.com"));
        verify(internshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("Active internship is publicly visible without applicant data")
    void activeInternshipPublicView() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.ACTIVE, 1L)));

        InternshipResponse result = service.getInternshipById(1L, null);

        assertEquals(1L, result.getId());
        assertTrue(result.getApplicantsList().isEmpty());
        assertNull(result.getPostedByEmail());
    }

    @Test
    @DisplayName("Non-active internship is hidden from non-owners")
    void draftHiddenFromStudent() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.DRAFT, 1L)));
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));

        assertThrows(AccessDeniedException.class, () -> service.getInternshipById(1L, "stud@internmatch.com"));
    }

    @Test
    @DisplayName("Owner can see their draft internship")
    void draftVisibleToOwner() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.DRAFT, 1L)));
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        when(applicationRepository.findByInternshipId(1L)).thenReturn(List.of());

        InternshipResponse result = service.getInternshipById(1L, "hr@acme.com");

        assertEquals("hr@acme.com", result.getPostedByEmail());
        assertTrue(result.getApplicantsList().isEmpty());
    }

    @Test
    @DisplayName("Non-owner cannot update an internship")
    void updateRejectedForNonOwner() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.DRAFT, 1L)));
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));

        assertThrows(AccessDeniedException.class,
                () -> service.updateInternship(1L, validRequest(InternshipStatus.ACTIVE), "stud@internmatch.com"));
    }

    @Test
    @DisplayName("Owner can update their internship")
    void updateByOwner() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.DRAFT, 1L)));
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applicationRepository.findByInternshipId(1L)).thenReturn(List.of());

        CreateInternshipRequest request = validRequest(InternshipStatus.ACTIVE);
        InternshipResponse result = service.updateInternship(1L, request, "hr@acme.com");

        assertEquals(InternshipStatus.ACTIVE, result.getStatus());
        verify(internshipRepository).save(any());
    }

    @Test
    @DisplayName("Delete removes applications first, then the internship")
    void deleteRemovesApplicationsThenInternship() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.ACTIVE, 1L)));
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));

        service.deleteInternship(1L, "hr@acme.com");

        verify(applicationRepository).deleteByInternshipId(1L);
        verify(internshipRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Non-owner cannot delete an internship")
    void deleteRejectedForNonOwner() {
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship(employer, InternshipStatus.ACTIVE, 1L)));
        when(userRepository.findByEmail("hr@globex.com")).thenReturn(Optional.of(otherEmployer));

        assertThrows(AccessDeniedException.class, () -> service.deleteInternship(1L, "hr@globex.com"));
        verify(internshipRepository, never()).deleteById(1L);
    }

    @Test
    @DisplayName("Non-active internships list only shows the caller's own postings")
    void draftListFilteredToOwned() {
        Internship mine = internship(employer, InternshipStatus.DRAFT, 1L);
        Internship theirs = internship(otherEmployer, InternshipStatus.DRAFT, 2L);
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        when(internshipRepository.findByStatus(InternshipStatus.DRAFT)).thenReturn(List.of(mine, theirs));

        List<InternshipResponse> results = service.getInternshipsByStatus(InternshipStatus.DRAFT, "hr@acme.com");

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
    }
}