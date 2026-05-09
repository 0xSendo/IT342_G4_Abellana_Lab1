package com.internmatch.internmatch.features.internship;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InternshipRepository extends JpaRepository<Internship, Long> {
    
    List<Internship> findByStatus(InternshipStatus status);
    
    List<Internship> findByPostedByIdOrderByCreatedAtDesc(Long userId);
    
    List<Internship> findByCompanyContainingIgnoreCase(String company);
    
    List<Internship> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT i FROM Internship i WHERE i.status = :status ORDER BY i.createdAt DESC")
    List<Internship> findActiveInternships(@Param("status") InternshipStatus status);
}
