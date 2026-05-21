package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.internship.dto.CreateInternshipRequest;
import com.internmatch.internmatch.features.internship.dto.InternshipResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internships")
@RequiredArgsConstructor
public class InternshipController {
    
    private final InternshipService internshipService;
    
    /**
     * Create a new internship posting
     */
    @PostMapping
    public ResponseEntity<?> createInternship(
            @Valid @RequestBody CreateInternshipRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            InternshipResponse response = internshipService.createInternship(request, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("MODERATION_ERROR")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
            }
            throw e;
        }
    }
    
    /**
     * Get internship by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<InternshipResponse> getInternshipById(@PathVariable Long id) {
        InternshipResponse response = internshipService.getInternshipById(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all active internships
     */
    @GetMapping("/active")
    public ResponseEntity<List<InternshipResponse>> getAllActiveInternships() {
        List<InternshipResponse> internships = internshipService.getAllActiveInternships();
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Get internships by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<InternshipResponse>> getInternshipsByStatus(
            @PathVariable InternshipStatus status) {
        List<InternshipResponse> internships = internshipService.getInternshipsByStatus(status);
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Get all internships (filtered by status or all)
     */
    @GetMapping
    public ResponseEntity<List<InternshipResponse>> getAllInternships(
            @RequestParam(required = false) InternshipStatus status) {
        List<InternshipResponse> internships;
        if (status != null) {
            internships = internshipService.getInternshipsByStatus(status);
        } else {
            internships = internshipService.getAllActiveInternships();
        }
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Search internships by company
     */
    @GetMapping("/search/company")
    public ResponseEntity<List<InternshipResponse>> searchByCompany(
            @RequestParam String company) {
        List<InternshipResponse> internships = internshipService.searchByCompany(company);
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Search internships by location
     */
    @GetMapping("/search/location")
    public ResponseEntity<List<InternshipResponse>> searchByLocation(
            @RequestParam String location) {
        List<InternshipResponse> internships = internshipService.searchByLocation(location);
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Get internships posted by authenticated user
     */
    @GetMapping("/my-postings")
    public ResponseEntity<List<InternshipResponse>> getMyInternships(
            Authentication authentication) {
        String userEmail = authentication.getName();
        com.internmatch.internmatch.features.auth.User user = internshipService.getUserByEmail(userEmail);
        List<InternshipResponse> internships = internshipService.getInternshipsByPostedUser(user.getId());
        return ResponseEntity.ok(internships);
    }
    
    /**
     * Update internship
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInternship(
            @PathVariable Long id,
            @Valid @RequestBody CreateInternshipRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            InternshipResponse response = internshipService.updateInternship(id, request, userEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("MODERATION_ERROR")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
            }
            throw e;
        }
    }
    
    /**
     * Delete internship
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInternship(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        internshipService.deleteInternship(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
