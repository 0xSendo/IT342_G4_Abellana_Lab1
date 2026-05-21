package com.internmatch.internmatch.features.common.community;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentModerationService {

    // Regex to detect most URL patterns
    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https?://|www\\.|[a-z0-9.-]+\\.(com|org|net|io|edu|gov|ph|me|info|biz))",
            Pattern.CASE_INSENSITIVE
    );

    // List of forbidden terms (expandable)
    private static final List<String> FORBIDDEN_TERMS = Arrays.asList(
            // Sample slurs/offensive terms - in a real app, this would be a much larger list
            "nigger", "faggot", "chink", "retard", "rape", "kill yourself", "kys", "hitler"
    );

    /**
     * Validates community content against moderation rules.
     * @param content The text to validate
     * @throws RuntimeException if content violates rules
     */
    public void validateContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        String normalizedContent = content.toLowerCase();

        // 1. Check for URLs/Links
        if (URL_PATTERN.matcher(normalizedContent).find()) {
            throw new RuntimeException("MODERATION_ERROR: External links are not permitted in community posts.");
        }

        // 2. Check for Forbidden Terms / Slurs
        for (String term : FORBIDDEN_TERMS) {
            if (normalizedContent.contains(term)) {
                throw new RuntimeException("MODERATION_ERROR: Your post contains inappropriate language that violates community standards.");
            }
        }
    }
}
