package com.internmatch.internmatch.features.common.community;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityPostService {

    private final CommunityPostRepository repository;

    public CommunityPost createPost(CommunityPost post) {
        // Strictly Enforce 1 post per student limit
        if (repository.findByStudentId(post.getStudent().getId()).isPresent()) {
            throw new RuntimeException("LIMIT_REACHED");
        }
        return repository.save(post);
    }

    @jakarta.annotation.PostConstruct
    public void hardResetOnStartup() {
        // Clearing all posts to reset the environment as requested
        repository.deleteAll();
        repository.flush();
    }

    public void deleteAllPosts() {
        repository.deleteAll();
        repository.flush();
    }

    public void cleanupDuplicates() {
        // This is a safety method to ensure clean state
        List<CommunityPost> all = repository.findAll();
        // Manual cleanup logic can be added here if needed for batch processing
    }

    public Optional<CommunityPost> findByStudentId(Long studentId) {
        return repository.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public List<CommunityPost> getAllPosts() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public void deletePost(Long id, Long studentId) {
        CommunityPost post = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to delete this post");
        }
        repository.delete(post);
    }

    public CommunityPost updatePost(Long id, Long studentId, String content) {
        CommunityPost post = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to update this post");
        }
        post.setContent(content);
        return repository.save(post);
    }

    public void deletePostAdmin(Long id) {
        repository.deleteById(id);
    }

    public CommunityPost updatePostAdmin(Long id, String content) {
        CommunityPost post = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setContent(content);
        return repository.save(post);
    }
}
