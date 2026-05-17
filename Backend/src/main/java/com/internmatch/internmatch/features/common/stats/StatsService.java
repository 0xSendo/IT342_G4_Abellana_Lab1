package com.internmatch.internmatch.features.common.stats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class StatsService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final com.internmatch.internmatch.features.internship.InternshipRepository internshipRepository;
    private final com.internmatch.internmatch.features.internship.ApplicationRepository applicationRepository;

    // World Bank API — free, no key needed, real PHL data sourced from PSA
    // SL.AGR.EMPL.ZS = % employed in Agriculture
    // SL.IND.EMPL.ZS = % employed in Industry
    // SL.SRV.EMPL.ZS = % employed in Services (Requested indicator)
    private static final String WB_URL =
        "https://api.worldbank.org/v2/country/PHL/indicator/{indicator}?format=json&mrv=1";

    private static final Map<String, String> INDICATORS = Map.of(
        "Agriculture",  "SL.AGR.EMPL.ZS",
        "Industry",     "SL.IND.EMPL.ZS",
        "Services",     "SL.SRV.EMPL.ZS"
    );

    public StatsService(RestTemplate restTemplate, 
                        ObjectMapper objectMapper,
                        com.internmatch.internmatch.features.internship.InternshipRepository internshipRepository,
                        com.internmatch.internmatch.features.internship.ApplicationRepository applicationRepository) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
    }

    public Map<String, Object> getEmployerInterest() {
        try {
            List<com.internmatch.internmatch.features.internship.Internship> internships = internshipRepository.findAll();
            Map<String, Integer> postingMap = new HashMap<>();
            Map<String, Integer> applicationMap = new HashMap<>();
            
            // Map internship ID to its category for faster application counting
            Map<Long, String> idToCategory = new HashMap<>();

            // Simple keyword-based categorization
            for (com.internmatch.internmatch.features.internship.Internship i : internships) {
                String title = i.getTitle().toLowerCase();
                String category = "Other";
                
                if (title.contains("dev") || title.contains("software") || title.contains("engineer") || title.contains("code")) {
                    category = "Tech & Development";
                } else if (title.contains("design") || title.contains("ui") || title.contains("ux") || title.contains("creative")) {
                    category = "Design & Creative";
                } else if (title.contains("market") || title.contains("social") || title.contains("sale") || title.contains("ads")) {
                    category = "Marketing & Sales";
                } else if (title.contains("data") || title.contains("analyst") || title.contains("science") || title.contains("stat")) {
                    category = "Data & Analytics";
                } else if (title.contains("admin") || title.contains("hr") || title.contains("manage") || title.contains("office")) {
                    category = "Business & Admin";
                }
                
                postingMap.put(category, postingMap.getOrDefault(category, 0) + 1);
                idToCategory.put(i.getId(), category);
            }

            // Count applications per category
            List<com.internmatch.internmatch.features.internship.Application> applications = applicationRepository.findAll();
            for (com.internmatch.internmatch.features.internship.Application a : applications) {
                String category = idToCategory.getOrDefault(a.getInternship().getId(), "Other");
                applicationMap.put(category, applicationMap.getOrDefault(category, 0) + 1);
            }

            List<Map<String, Object>> interestData = new ArrayList<>();
            for (String category : postingMap.keySet()) {
                Map<String, Object> item = new HashMap<>();
                item.put("category", category);
                item.put("postings", postingMap.get(category));
                item.put("applications", applicationMap.getOrDefault(category, 0));
                interestData.add(item);
            }
            
            // Sort by postings descending
            interestData.sort((a, b) -> (Integer) b.get("postings") - (Integer) a.get("postings"));

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("data", interestData);
            response.put("totalPostings", internships.size());
            response.put("totalApplications", applications.size());
            response.put("lastUpdated", LocalDateTime.now().toString());
            return response;
        } catch (Exception e) {
            return Map.of("data", Collections.emptyList());
        }
    }

    @Cacheable(value = "jobTrends", unless = "#result == null")
    public Map<String, Object> getJobTrends() {
        try {
            List<Map<String, Object>> sectors = new ArrayList<>();

            for (Map.Entry<String, String> entry : INDICATORS.entrySet()) {
                String url = WB_URL.replace("{indicator}", entry.getValue());
                String rawJson = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(rawJson);

                // World Bank returns array: [metadata, data[]]
                if (root.isArray() && root.size() > 1) {
                    JsonNode dataArray = root.get(1);
                    if (dataArray != null && dataArray.isArray() && dataArray.size() > 0) {
                        JsonNode latest = dataArray.get(0);
                        double value = latest.path("value").asDouble(0);

                        Map<String, Object> sector = new LinkedHashMap<>();
                        sector.put("sector", entry.getKey());
                        sector.put("employmentRate", Math.round(value * 10.0) / 10.0);
                        sectors.add(sector);
                    }
                }
            }

            // Sort by employment rate descending
            sectors.sort((a, b) -> Double.compare((Double) b.get("employmentRate"), (Double) a.get("employmentRate")));

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("data", sectors);
            response.put("lastUpdated", LocalDateTime.now().toString());
            response.put("source", "World Bank Indicators API (sourced from PSA Philippines)");
            return response;

        } catch (Exception e) {
            return getFallbackData();
        }
    }

    // Shows if World Bank API is temporarily unreachable
    private Map<String, Object> getFallbackData() {
        List<Map<String, Object>> sectors = List.of(
            Map.of("sector", "Services",     "employmentRate", 60.1),
            Map.of("sector", "Agriculture",  "employmentRate", 22.4),
            Map.of("sector", "Industry",     "employmentRate", 17.5)
        );
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", sectors);
        response.put("lastUpdated", LocalDateTime.now().toString());
        response.put("source", "PSA Labor Force Survey 2023 (cached)");
        return response;
    }
}