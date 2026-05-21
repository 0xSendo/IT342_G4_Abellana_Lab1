package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.internship.dto.ApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.internmatch.internmatch.features.common.notification.NotificationService;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ApplicationResponse applyToInternship(Long internshipId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new IllegalArgumentException("Internship not found"));

        // Check if already applied
        if (applicationRepository.existsByStudentIdAndInternshipId(student.getId(), internshipId)) {
            throw new IllegalStateException("You have already applied to this internship");
        }

        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .resumePath(student.getResumeUrl() != null ? student.getResumeUrl() : "No resume uploaded")
                .status(ApplicationStatus.PENDING)
                .build();

        Application saved = applicationRepository.save(application);

        // Notify Employer
        notificationService.createNotification(
            internship.getPostedBy(),
            "New Application Received",
            student.getName() + " has applied for the position: " + internship.getTitle(),
            "APPLICATION",
            saved.getId()
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, ApplicationStatus newStatus, String employerEmail) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        Internship internship = application.getInternship();
        
        // Verify employer owns the internship
        if (!internship.getPostedBy().getEmail().equals(employerEmail)) {
            throw new IllegalStateException("Unauthorized to update this application");
        }

        application.setStatus(newStatus);
        Application updated = applicationRepository.save(application);

        // Notify Student
        String message = "Your application for '" + internship.getTitle() + "' at '" + internship.getCompany() + 
                         "' has been updated to: " + newStatus;
        
        notificationService.createNotification(
            application.getStudent(),
            "Application Status Updated",
            message,
            "STATUS_UPDATE",
            updated.getId()
        );

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getStudentApplications(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        
        return applicationRepository.findByStudentId(student.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getInternshipApplications(Long internshipId) {
        return applicationRepository.findByInternshipId(internshipId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplicationsAdmin() {
        return applicationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteApplicationAdmin(Long id) {
        applicationRepository.deleteById(id);
    }

    private ApplicationResponse mapToResponse(Application application) {
        User student = application.getStudent();
        return ApplicationResponse.builder()
                .id(application.getId())
                .studentId(student.getId())
                .studentName(student.getName())
                .studentEmail(student.getEmail())
                .studentProgram(student.getProgram())
                .studentYearLevel(student.getYearLevel())
                .studentBio(student.getBio())
                .studentSkills(student.getSkills())
                .studentProjects(student.getProjects())
                .internshipId(application.getInternship().getId())
                .internshipTitle(application.getInternship().getTitle())
                .company(application.getInternship().getCompany())
                .resumePath(application.getResumePath())
                .status(application.getStatus())
                .appliedAt(application.getAppliedAt())
                .build();
    }
}
