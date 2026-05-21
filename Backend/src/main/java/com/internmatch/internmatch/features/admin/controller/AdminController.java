package com.internmatch.internmatch.features.admin.controller;

import com.internmatch.internmatch.features.common.community.CommunityPostDto;
import com.internmatch.internmatch.features.common.community.CommunityPostService;
import com.internmatch.internmatch.features.internship.dto.ApplicationResponse;
import com.internmatch.internmatch.features.internship.ApplicationService;
import com.internmatch.internmatch.features.internship.InternshipService;
import com.internmatch.internmatch.features.internship.dto.CreateInternshipRequest;
import com.internmatch.internmatch.features.internship.dto.InternshipResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final InternshipService internshipService;
    private final CommunityPostService communityPostService;
    private final ApplicationService applicationService;
    private final com.internmatch.internmatch.features.auth.UserRepository userRepository;

    // --- USER MANAGEMENT ---

    @PutMapping("/users/{id}/role")
    public ResponseEntity<com.internmatch.internmatch.features.auth.User> updateUserRole(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        com.internmatch.internmatch.features.auth.User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String roleStr = request.get("role");
        user.setRole(com.internmatch.internmatch.features.auth.Role.valueOf(roleStr));
        return ResponseEntity.ok(userRepository.save(user));
    }

    // --- INTERNSHIP MANAGEMENT ---
    
    @GetMapping("/internships")
    public ResponseEntity<List<InternshipResponse>> getAllInternships() {
        return ResponseEntity.ok(internshipService.getAllInternshipsAdmin());
    }

    @PutMapping("/internships/{id}")
    public ResponseEntity<InternshipResponse> updateInternship(@PathVariable Long id, @RequestBody CreateInternshipRequest request) {
        return ResponseEntity.ok(internshipService.updateInternshipAdmin(id, request));
    }

    @DeleteMapping("/internships/{id}")
    public ResponseEntity<Void> deleteInternship(@PathVariable Long id) {
        internshipService.deleteInternshipAdmin(id);
        return ResponseEntity.noContent().build();
    }

    // --- COMMUNITY MANAGEMENT ---

    @GetMapping("/community")
    public ResponseEntity<List<CommunityPostDto>> getAllCommunityPosts() {
        return ResponseEntity.ok(communityPostService.getAllPosts().stream()
                .map(post -> CommunityPostDto.builder()
                        .id(post.getId())
                        .studentId(post.getStudent().getId())
                        .studentName(post.getStudent().getName())
                        .studentEmail(post.getStudent().getEmail())
                        .content(post.getContent())
                        .type(post.getType())
                        .createdAt(post.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList()));
    }

    @PutMapping("/community/{id}")
    public ResponseEntity<?> updateCommunityPost(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String content = request.get("content");
        return ResponseEntity.ok(communityPostService.updatePostAdmin(id, content));
    }

    @DeleteMapping("/community/{id}")
    public ResponseEntity<Void> deleteCommunityPost(@PathVariable Long id) {
        communityPostService.deletePostAdmin(id);
        return ResponseEntity.noContent().build();
    }

    // --- APPLICATION MANAGEMENT ---

    @GetMapping("/applications")
    public ResponseEntity<List<ApplicationResponse>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplicationsAdmin());
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        applicationService.deleteApplicationAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
