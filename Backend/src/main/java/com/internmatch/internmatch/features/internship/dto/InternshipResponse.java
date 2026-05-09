package com.internmatch.internmatch.features.internship.dto;

import com.internmatch.internmatch.features.internship.InternshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternshipResponse {
    private Long id;
    private String title;
    private String description;
    private String company;
    private String location;
    private String setup;
    private InternshipStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String postedByEmail;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private List<ApplicationResponse> applicantsList;
}
