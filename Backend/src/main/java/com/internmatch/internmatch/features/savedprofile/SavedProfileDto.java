package com.internmatch.internmatch.features.savedprofile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedProfileDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentProgram;
    private String studentYearLevel;
    private String studentSkills;
    private String studentBio;
    private String studentProjects;
    private String studentResumeUrl;
    private String savedAt;
}
