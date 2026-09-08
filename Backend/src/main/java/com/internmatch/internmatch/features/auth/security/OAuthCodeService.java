package com.internmatch.internmatch.features.auth.security;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OAuthCodeService {

    private static final long CODE_TTL_MS = 2 * 60 * 1000; // 2 minutes
    private static final int CODE_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, CodeEntry> codes = new ConcurrentHashMap<>();

    public String issueCode(String email) {
        byte[] bytes = new byte[CODE_BYTES];
        secureRandom.nextBytes(bytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        codes.put(code, new CodeEntry(email, Instant.now()));
        sweepExpired();
        return code;
    }

    public String redeemCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        CodeEntry entry = codes.remove(code);
        if (entry == null) {
            return null;
        }
        if (entry.createdAt().isBefore(Instant.now().minusMillis(CODE_TTL_MS))) {
            return null;
        }
        return entry.email();
    }

    private void sweepExpired() {
        Instant cutoff = Instant.now().minusMillis(CODE_TTL_MS);
        codes.entrySet().removeIf(e -> e.getValue().createdAt().isBefore(cutoff));
    }

    private record CodeEntry(String email, Instant createdAt) {
    }
}