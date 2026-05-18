package com.internmatch.internmatch.features.internship;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByInternshipId(Long internshipId);
    boolean existsByStudentIdAndInternshipId(Long studentId, Long internshipId);
    
    @Modifying
    @Query("DELETE FROM Application a WHERE a.internship.id = :internshipId")
    void deleteByInternshipId(@Param("internshipId") Long internshipId);
}
