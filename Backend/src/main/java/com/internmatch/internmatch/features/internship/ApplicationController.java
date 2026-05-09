package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.internship.dto.ApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/apply/{internshipId}")
    public ResponseEntity<ApplicationResponse> apply(@PathVariable Long internshipId, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(applicationService.applyToInternship(internshipId, email));
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<ApplicationResponse>> getMyApplications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(applicationService.getStudentApplications(email));
    }

    @GetMapping("/internship/{internshipId}")
    public ResponseEntity<List<ApplicationResponse>> getInternshipApplications(@PathVariable Long internshipId) {
        return ResponseEntity.ok(applicationService.getInternshipApplications(internshipId));
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long applicationId,
            @RequestParam ApplicationStatus status,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, status, email));
    }
}
