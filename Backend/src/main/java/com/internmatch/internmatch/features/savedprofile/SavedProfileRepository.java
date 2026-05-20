package com.internmatch.internmatch.features.savedprofile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SavedProfileRepository extends JpaRepository<SavedProfile, Long> {
    List<SavedProfile> findByEmployerId(Long employerId);
    Optional<SavedProfile> findByEmployerIdAndStudentId(Long employerId, Long studentId);

    @Modifying
    @Query("DELETE FROM SavedProfile s WHERE s.employer.id = :employerId AND s.student.id = :studentId")
    void deleteByEmployerIdAndStudentId(@Param("employerId") Long employerId, @Param("studentId") Long studentId);
}
