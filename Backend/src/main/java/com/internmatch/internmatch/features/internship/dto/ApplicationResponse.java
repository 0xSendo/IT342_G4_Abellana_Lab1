package com.internmatch.internmatch.features.internship.dto;

import com.internmatch.internmatch.features.internship.ApplicationStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long internshipId;
    private String internshipTitle;
    private String company;
    private String resumePath;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}
