package com.internmatch.internmatch.features.internship.dto;

import com.internmatch.internmatch.features.internship.InternshipStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInternshipRequest {
    
    @NotBlank(message = "Internship title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Company name is required")
    private String company;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotBlank(message = "Setup is required")
    private String setup;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    private InternshipStatus status = InternshipStatus.DRAFT;
}
