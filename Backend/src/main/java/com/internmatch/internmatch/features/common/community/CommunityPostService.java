package com.internmatch.internmatch.features.common.community;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityPostService {

    private final CommunityPostRepository repository;

    public CommunityPost createPost(CommunityPost post) {
        // Automatically clean up any existing posts for this student before saving new one
        repository.deleteByStudentId(post.getStudent().getId());
        repository.flush(); // Force immediate deletion
        return repository.save(post);
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
}
