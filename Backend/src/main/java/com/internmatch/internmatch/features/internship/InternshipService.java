package com.internmatch.internmatch.features.internship;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import com.internmatch.internmatch.features.internship.dto.CreateInternshipRequest;
import com.internmatch.internmatch.features.internship.dto.InternshipResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InternshipService {
    
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final com.internmatch.internmatch.features.common.community.ContentModerationService moderationService;
    
    /**
     * Create a new internship posting
     */
    public InternshipResponse createInternship(CreateInternshipRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // MODERATION: Validate input fields
        moderationService.validateContent(request.getTitle());
        moderationService.validateContent(request.getDescription());
        moderationService.validateContent(request.getCompany());
        moderationService.validateContent(request.getLocation());
        
        Internship internship = Internship.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .company(request.getCompany())
                .location(request.getLocation())
                .setup(request.getSetup())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus())
                .postedBy(user)
                .createdAt(LocalDate.now())
                .updatedAt(LocalDate.now())
                .build();
        
        Internship saved = internshipRepository.save(internship);
        return mapToResponse(saved);
    }
    
    /**
     * Get internship by ID
     */
    @Transactional(readOnly = true)
    public InternshipResponse getInternshipById(Long id) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internship not found with id: " + id));
        return mapToResponse(internship);
    }
    
    /**
     * Get all active internships
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> getAllActiveInternships() {
        return internshipRepository.findActiveInternships(InternshipStatus.ACTIVE)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get internships by status
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> getInternshipsByStatus(InternshipStatus status) {
        return internshipRepository.findByStatus(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get internships posted by a specific user
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> getInternshipsByPostedUser(Long userId) {
        return internshipRepository.findByPostedByIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }
    
    /**
     * Search internships by company
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> searchByCompany(String company) {
        return internshipRepository.findByCompanyContainingIgnoreCase(company)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Search internships by location
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> searchByLocation(String location) {
        return internshipRepository.findByLocationContainingIgnoreCase(location)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Update internship
     */
    public InternshipResponse updateInternship(Long id, CreateInternshipRequest request, String userEmail) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internship not found with id: " + id));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (!internship.getPostedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to update this internship");
        }

        // MODERATION: Validate input fields
        moderationService.validateContent(request.getTitle());
        moderationService.validateContent(request.getDescription());
        moderationService.validateContent(request.getCompany());
        moderationService.validateContent(request.getLocation());
        
        internship.setTitle(request.getTitle());
        internship.setDescription(request.getDescription());
        internship.setCompany(request.getCompany());
        internship.setLocation(request.getLocation());
        internship.setSetup(request.getSetup());
        internship.setStartDate(request.getStartDate());
        internship.setEndDate(request.getEndDate());
        internship.setStatus(request.getStatus());
        internship.setUpdatedAt(LocalDate.now());
        
        Internship updated = internshipRepository.save(internship);
        return mapToResponse(updated);
    }
    
    /**
     * Delete internship
     */
    public void deleteInternship(Long id, String userEmail) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internship not found with id: " + id));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (!internship.getPostedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to delete this internship");
        }
        
        // Delete all applications associated with this internship first
        applicationRepository.deleteByInternshipId(id);
        
        internshipRepository.deleteById(id);
    }
    
    /**
     * Get all internships (regardless of status or owner)
     */
    @Transactional(readOnly = true)
    public List<InternshipResponse> getAllInternshipsAdmin() {
        return internshipRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update internship by admin (no ownership check)
     */
    public InternshipResponse updateInternshipAdmin(Long id, CreateInternshipRequest request) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internship not found with id: " + id));
        
        // MODERATION: Validate input fields
        moderationService.validateContent(request.getTitle());
        moderationService.validateContent(request.getDescription());
        moderationService.validateContent(request.getCompany());
        moderationService.validateContent(request.getLocation());

        internship.setTitle(request.getTitle());
        internship.setDescription(request.getDescription());
        internship.setCompany(request.getCompany());
        internship.setLocation(request.getLocation());
        internship.setSetup(request.getSetup());
        internship.setStartDate(request.getStartDate());
        internship.setEndDate(request.getEndDate());
        internship.setStatus(request.getStatus());
        internship.setUpdatedAt(LocalDate.now());
        
        Internship updated = internshipRepository.save(internship);
        return mapToResponse(updated);
    }

    /**
     * Delete internship by admin (no ownership check)
     */
    public void deleteInternshipAdmin(Long id) {
        if (!internshipRepository.existsById(id)) {
            throw new IllegalArgumentException("Internship not found with id: " + id);
        }
        applicationRepository.deleteByInternshipId(id);
        internshipRepository.deleteById(id);
    }
    
    /**
     * Map Internship entity to response DTO
     */
    private InternshipResponse mapToResponse(Internship internship) {
        List<com.internmatch.internmatch.features.internship.dto.ApplicationResponse> apps = 
            applicationRepository.findByInternshipId(internship.getId())
                .stream()
                .map(app -> com.internmatch.internmatch.features.internship.dto.ApplicationResponse.builder()
                        .id(app.getId())
                        .studentId(app.getStudent().getId())
                        .studentName(app.getStudent().getName())
                        .studentEmail(app.getStudent().getEmail())
                        .internshipId(internship.getId())
                        .internshipTitle(internship.getTitle())
                        .company(internship.getCompany())
                        .resumePath(app.getResumePath())
                        .status(app.getStatus())
                        .appliedAt(app.getAppliedAt())
                        .build())
                .collect(Collectors.toList());

        return InternshipResponse.builder()
                .id(internship.getId())
                .title(internship.getTitle())
                .description(internship.getDescription())
                .company(internship.getCompany())
                .location(internship.getLocation())
                .setup(internship.getSetup())
                .status(internship.getStatus())
                .startDate(internship.getStartDate())
                .endDate(internship.getEndDate())
                .postedByEmail(internship.getPostedBy().getEmail())
                .postedByName(internship.getPostedBy().getName())
                .createdAt(internship.getCreatedAt())
                .updatedAt(internship.getUpdatedAt())
                .applicantsList(apps)
                .build();
    }
}
