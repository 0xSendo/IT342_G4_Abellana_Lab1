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

    public StatsService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
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