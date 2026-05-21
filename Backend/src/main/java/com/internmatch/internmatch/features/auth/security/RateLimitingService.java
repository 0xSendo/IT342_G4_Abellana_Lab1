package com.internmatch.internmatch.features.auth.security;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimitingService {

    private final ConcurrentHashMap<String, AtomicInteger> ipRequestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> ipLastReset = new ConcurrentHashMap<>();
    
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_MS = TimeUnit.MINUTES.toMillis(1);

    public boolean isAllowed(String ip) {
        long now = System.currentTimeMillis();
        ipLastReset.putIfAbsent(ip, now);
        
        if (now - ipLastReset.get(ip) > WINDOW_MS) {
            ipRequestCounts.put(ip, new AtomicInteger(0));
            ipLastReset.put(ip, now);
        }
        
        AtomicInteger count = ipRequestCounts.computeIfAbsent(ip, k -> new AtomicInteger(0));
        return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
    }
}
