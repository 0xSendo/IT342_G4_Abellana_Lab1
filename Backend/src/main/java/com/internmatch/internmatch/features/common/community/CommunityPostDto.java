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
    private String studentName;
    private String studentProgram;
    private String studentEmail;
    private String content;
    private String type;
    private String createdAt;
}
