package com.internmatch.internmatch.features.common.stats;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internmatch.internmatch.features.internship.Application;
import com.internmatch.internmatch.features.internship.ApplicationRepository;
import com.internmatch.internmatch.features.internship.Internship;
import com.internmatch.internmatch.features.internship.InternshipRepository;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Epic("Analytics")
@Feature("Dashboard Insights")
class StatsServiceTest {

    @Mock
    private RestTemplate restTemplate;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private ApplicationRepository applicationRepository;

    private StatsService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new StatsService(restTemplate, objectMapper, internshipRepository, applicationRepository);
    }

    private Internship internship(Long id, String title) {
        return Internship.builder().id(id).title(title).build();
    }

    private Application application(Long id, Internship internship) {
        return Application.builder().id(id).internship(internship).build();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> dataOf(Map<String, Object> response) {
        return (List<Map<String, Object>>) response.get("data");
    }

    private Map<String, Object> findByCategory(List<Map<String, Object>> data, String category) {
        return data.stream()
                .filter(item -> category.equals(item.get("category")))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing category: " + category));
    }

    @Nested
    @Story("Employer interest aggregation")
    class EmployerInterest {

        @Test
        @DisplayName("Categorizes postings by title keywords and counts applications per category")
        void categorizesAndCounts() {
            Internship dev = internship(1L, "Software Engineer Intern");
            Internship secondDev = internship(2L, "Backend Developer Intern");
            Internship design = internship(3L, "UI/UX Designer");
            Internship dataIntern = internship(4L, "Data Analyst");
            Internship marketing = internship(5L, "Marketing Intern");
            Internship admin = internship(6L, "Office Admin Assistant");
            Internship other = internship(7L, "General Support");

            when(internshipRepository.findAll()).thenReturn(List.of(
                    dev, secondDev, design, dataIntern, marketing, admin, other));
            when(applicationRepository.findAll()).thenReturn(List.of(
                    application(1L, dev),
                    application(2L, dev),
                    application(3L, design),
                    application(4L, marketing)));

            Map<String, Object> response = service.getEmployerInterest();

            List<Map<String, Object>> data = dataOf(response);
            assertEquals(7, response.get("totalPostings"));
            assertEquals(4, response.get("totalApplications"));

            // Tech & Development holds the most postings, so it sorts first.
            assertEquals("Tech & Development", data.get(0).get("category"));
            assertEquals(2, data.get(0).get("postings"));
            assertEquals(2, data.get(0).get("applications"));

            assertEquals(1, findByCategory(data, "Design & Creative").get("postings"));
            assertEquals(1, findByCategory(data, "Marketing & Sales").get("postings"));
            assertEquals(1, findByCategory(data, "Data & Analytics").get("postings"));
            assertEquals(1, findByCategory(data, "Business & Admin").get("postings"));
            assertEquals(1, findByCategory(data, "Other").get("postings"));
            assertEquals(0, findByCategory(data, "Data & Analytics").get("applications"));
        }

        @Test
        @DisplayName("Category fallback returns Other for unrecognized titles")
        void unrecognizedTitleBecomesOther() {
            when(internshipRepository.findAll()).thenReturn(List.of(internship(9L, "Startup Explorer")));
            when(applicationRepository.findAll()).thenReturn(List.of());

            List<Map<String, Object>> data = dataOf(service.getEmployerInterest());

            assertEquals(1, data.size());
            assertEquals("Other", data.get(0).get("category"));
        }

        @Test
        @DisplayName("Returns an empty payload when the repositories are unavailable")
        void repositoryFailureReturnsEmptyPayload() {
            when(internshipRepository.findAll()).thenThrow(new RuntimeException("db down"));

            Map<String, Object> response = service.getEmployerInterest();

            assertTrue(dataOf(response).isEmpty());
        }
    }

    @Nested
    @Story("Job trends from external data")
    class JobTrends {

        @Test
        @DisplayName("Parses World Bank JSON and sorts sectors by employment rate")
        void parsesAndSortsWorldBankJson() {
            List<String> urls = List.of(
                    "SL.SRV.EMPL.ZS", "SL.AGR.EMPL.ZS", "SL.IND.EMPL.ZS");
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenAnswer(inv -> {
                String url = inv.getArgument(0);
                for (String indicator : urls) {
                    if (url.contains(indicator)) {
                        return "[{\"page\":1,\"pages\":1},[{\"value\":" + jsonValue(indicator) + "}]]";
                    }
                }
                return "[{\"none\":true}]";
            });

            Map<String, Object> response = service.getJobTrends();

            List<Map<String, Object>> data = dataOf(response);
            assertEquals("Services", data.get(0).get("sector"));
            assertEquals(60.1, data.get(0).get("employmentRate"));
            assertEquals("Industry", data.get(2).get("sector"));
            assertEquals(17.5, data.get(2).get("employmentRate"));
            assertEquals("World Bank Indicators API (sourced from PSA Philippines)", response.get("source"));
        }

        private double jsonValue(String indicator) {
            switch (indicator) {
                case "SL.SRV.EMPL.ZS":
                    return 60.1;
                case "SL.AGR.EMPL.ZS":
                    return 22.4;
                default:
                    return 17.5;
            }
        }

        @Test
        @DisplayName("Falls back to cached PSA data when the World Bank call fails")
        void fallsBackWhenWorldBankUnreachable() {
            when(restTemplate.getForObject(anyString(), eq(String.class)))
                    .thenThrow(new RuntimeException("connection refused"));

            Map<String, Object> response = service.getJobTrends();

            assertEquals("PSA Labor Force Survey 2023 (cached)", response.get("source"));
            assertEquals(3, dataOf(response).size());
        }
    }
}