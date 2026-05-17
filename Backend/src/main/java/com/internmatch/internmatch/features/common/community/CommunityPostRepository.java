package com.internmatch.internmatch.features.common.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
    Optional<CommunityPost> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
}
