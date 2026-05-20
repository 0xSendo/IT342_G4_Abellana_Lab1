package com.internmatch.internmatch.features.savedprofile;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedProfileService {

    private final SavedProfileRepository savedProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public void saveProfile(String employerEmail, Long studentId) {
        User employer = userRepository.findByEmail(employerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Employer not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        if (savedProfileRepository.findByEmployerIdAndStudentId(employer.getId(), studentId).isPresent()) {
            return; // Already saved
        }

        SavedProfile savedProfile = SavedProfile.builder()
                .employer(employer)
                .student(student)
                .build();

        savedProfileRepository.save(savedProfile);
    }

    @Transactional
    public void unsaveProfile(String employerEmail, Long studentId) {
        User employer = userRepository.findByEmail(employerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Employer not found"));
        savedProfileRepository.deleteByEmployerIdAndStudentId(employer.getId(), studentId);
    }

    @Transactional(readOnly = true)
    public List<SavedProfileDto> getSavedProfiles(String employerEmail) {
        User employer = userRepository.findByEmail(employerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Employer not found"));
        
        return savedProfileRepository.findByEmployerId(employer.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isProfileSaved(String employerEmail, Long studentId) {
        User employer = userRepository.findByEmail(employerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Employer not found"));
        return savedProfileRepository.findByEmployerIdAndStudentId(employer.getId(), studentId).isPresent();
    }

    private SavedProfileDto mapToDto(SavedProfile savedProfile) {
        User student = savedProfile.getStudent();
        return SavedProfileDto.builder()
                .id(savedProfile.getId())
                .studentId(student.getId())
                .studentName(student.getName())
                .studentEmail(student.getEmail())
                .studentProgram(student.getProgram())
                .studentYearLevel(student.getYearLevel())
                .studentSkills(student.getSkills())
                .studentBio(student.getBio())
                .studentProjects(student.getProjects())
                .studentResumeUrl(student.getResumeUrl())
                .savedAt(savedProfile.getSavedAt().toString())
                .build();
    }
}
