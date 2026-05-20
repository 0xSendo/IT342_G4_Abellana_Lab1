package com.internmatch.internmatch.features.common.community;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentProgram;
    private String studentEmail;
    private String studentBio;
    private String studentSkills;
    private String studentProjects;
    private String studentYearLevel;
    private String studentResumeUrl;
    private String content;
    private String type;
    private String createdAt;
}
