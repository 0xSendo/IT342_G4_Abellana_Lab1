package com.internmatch.internmatch.features.common.stats;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/job-trends")
    public ResponseEntity<Map<String, Object>> getJobTrends() {
        return ResponseEntity.ok(statsService.getJobTrends());
    }
}
