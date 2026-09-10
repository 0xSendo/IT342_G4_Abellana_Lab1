package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.common.notification.NotificationService;
import com.internmatch.internmatch.features.internship.dto.ApplicationResponse;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Internship Management")
@Feature("Application Workflow")
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    private ApplicationService service;

    private User student;
    private User employer;
    private Internship activeInternship;

    @BeforeEach
    void setUp() {
        service = new ApplicationService(applicationRepository, internshipRepository, userRepository, notificationService);

        student = User.builder()
                .id(1L).email("stud@internmatch.com").name("Student").role(Role.STUDENT).tokenVersion(0).build();
        employer = User.builder()
                .id(2L).email("hr@acme.com").name("ACME HR").role(Role.EMPLOYER).tokenVersion(0).build();
        activeInternship = Internship.builder()
                .id(5L)
                .title("Software Engineering Intern")
                .company("ACME Corp")
                .status(InternshipStatus.ACTIVE)
                .postedBy(employer)
                .build();
    }

    private Application applicationWithId(Long id) {
        return Application.builder()
                .id(id)
                .student(student)
                .internship(activeInternship)
                .resumePath("No resume uploaded")
                .status(ApplicationStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("Student applies successfully and employer is notified")
    void applySuccessNotifiesEmployer() {
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));
        when(applicationRepository.existsByStudentIdAndInternshipId(1L, 5L)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application app = inv.getArgument(0);
            app.setId(99L);
            return app;
        });

        ApplicationResponse result = service.applyToInternship(5L, "stud@internmatch.com");

        assertEquals(ApplicationStatus.PENDING, result.getStatus());
        assertEquals("No resume uploaded", result.getResumePath());
        assertEquals(5L, result.getInternshipId());
        verify(notificationService).createNotification(eq(employer), anyString(), anyString(), eq("APPLICATION"), eq(99L));
    }

    @Test
    @DisplayName("Student's profile resume URL is used as application resume")
    void applyUsesProfileResume() {
        student.setResumeUrl("https://storage.example.com/resume.pdf");
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));
        when(applicationRepository.existsByStudentIdAndInternshipId(1L, 5L)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse result = service.applyToInternship(5L, "stud@internmatch.com");

        assertEquals("https://storage.example.com/resume.pdf", result.getResumePath());
    }

    @Test
    @DisplayName("Non-students cannot apply for internships")
    void nonStudentCannotApply() {
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.applyToInternship(5L, "hr@acme.com"));
        assertEquals("Only students can apply for internships", ex.getMessage());
        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Applications are rejected for closed internships")
    void closedInternshipRejected() {
        activeInternship.setStatus(InternshipStatus.CLOSED);
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));

        assertThrows(IllegalStateException.class, () -> service.applyToInternship(5L, "stud@internmatch.com"));
    }

    @Test
    @DisplayName("Duplicate applications are blocked")
    void duplicateApplicationRejected() {
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));
        when(applicationRepository.existsByStudentIdAndInternshipId(1L, 5L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.applyToInternship(5L, "stud@internmatch.com"));
    }

    @Test
    @DisplayName("Employer can update the application status and notify the student")
    void updateStatusByOwner() {
        Application pending = applicationWithId(1L);
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse result = service.updateApplicationStatus(1L, ApplicationStatus.ACCEPTED, "hr@acme.com");

        assertEquals(ApplicationStatus.ACCEPTED, result.getStatus());
        verify(notificationService).createNotification(eq(student), anyString(), anyString(), eq("STATUS_UPDATE"), eq(1L));
    }

    @Test
    @DisplayName("Non-owner cannot update application status")
    void updateStatusRejectedForNonOwner() {
        Application pending = applicationWithId(1L);
        pending.getInternship().getPostedBy().setEmail("someone-else@acme.com");
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(pending));

        assertThrows(AccessDeniedException.class,
                () -> service.updateApplicationStatus(1L, ApplicationStatus.REJECTED, "hr@acme.com"));
    }

    @Test
    @DisplayName("Owner can list applicants for their internship")
    void ownerListsApplicants() {
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));
        when(userRepository.findByEmail("hr@acme.com")).thenReturn(Optional.of(employer));
        when(applicationRepository.findByInternshipId(5L)).thenReturn(List.of(applicationWithId(1L)));

        List<ApplicationResponse> results = service.getInternshipApplications(5L, "hr@acme.com");

        assertEquals(1, results.size());
        assertEquals(student.getId(), results.get(0).getStudentId());
        assertEquals("stud@internmatch.com", results.get(0).getStudentEmail());
    }

    @Test
    @DisplayName("Student cannot view another employer's applications")
    void studentCannotViewApplicants() {
        when(internshipRepository.findById(5L)).thenReturn(Optional.of(activeInternship));
        when(userRepository.findByEmail("stud@internmatch.com")).thenReturn(Optional.of(student));

        assertThrows(AccessDeniedException.class,
                () -> service.getInternshipApplications(5L, "stud@internmatch.com"));
    }
}