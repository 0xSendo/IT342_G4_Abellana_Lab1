package com.internmatch.internmatch.features.common.community;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Slf4j
public class CommunityController {

    private final CommunityPostService communityPostService;
    private final UserRepository userRepository;

    @PostMapping("/post")
    public ResponseEntity<?> createPost(Authentication authentication, @RequestBody PostRequest request) {
        log.info("Received community post request from: {}", authentication != null ? authentication.getName() : "anonymous");
        
        if (authentication == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CommunityPost post = CommunityPost.builder()
                .student(user)
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "GENERAL_UPDATE")
                .build();

        CommunityPost saved = communityPostService.createPost(post);
        log.info("Successfully saved post ID: {} for user: {}", saved.getId(), user.getEmail());
        
        return ResponseEntity.ok(convertToDto(saved));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CommunityPostDto>> getAllPosts() {
        List<CommunityPost> allPosts = communityPostService.getAllPosts();
        log.info("Fetching all community posts. Count: {}", allPosts.size());
        List<CommunityPostDto> dtos = allPosts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Community API is active. Total posts: " + communityPostService.getAllPosts().size());
    }

    @PostMapping("/reset")
    public ResponseEntity<String> resetAllPosts() {
        communityPostService.deleteAllPosts();
        log.info("COMMUNITY RESET: All posts have been cleared.");
        return ResponseEntity.ok("Community feed has been reset and all posts deleted.");
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePost(Authentication authentication, @PathVariable Long id, @RequestBody PostRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        log.info("Updating community post ID: {} by user: {}", id, user.getEmail());
        return ResponseEntity.ok(convertToDto(communityPostService.updatePost(id, user.getId(), request.getContent())));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePost(Authentication authentication, @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        log.info("Deleting community post ID: {} by user: {}", id, user.getEmail());
        communityPostService.deletePost(id, user.getId());
        return ResponseEntity.ok().build();
    }

    private CommunityPostDto convertToDto(CommunityPost post) {
        User student = post.getStudent();
        return CommunityPostDto.builder()
                .id(post.getId())
                .studentId(student != null ? student.getId() : null)
                .studentName(student != null ? student.getName() : "Anonymous")
                .studentProgram(student != null ? student.getProgram() : "N/A")
                .studentEmail(student != null ? student.getEmail() : "unknown")
                .studentBio(student != null ? student.getBio() : null)
                .studentSkills(student != null ? student.getSkills() : null)
                .studentProjects(student != null ? student.getProjects() : null)
                .studentYearLevel(student != null ? student.getYearLevel() : null)
                .studentResumeUrl(student != null ? student.getResumeUrl() : null)
                .content(post.getContent())
                .type(post.getType())
                .createdAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "")
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PostRequest {
        private String content;
        private String type;
    }
}
