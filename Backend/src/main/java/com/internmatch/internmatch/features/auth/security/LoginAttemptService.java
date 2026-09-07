package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = TimeUnit.MINUTES.toMillis(15);
    private static final long BASE_LOCKOUT_MS = TimeUnit.MINUTES.toMillis(15);
    private static final long MAX_LOCKOUT_MS = TimeUnit.HOURS.toMillis(6);
    private static final int MAX_ESCALATIONS = 5;
    private static final int MAX_TRACKED_KEYS = 100_000;

    private final UserRepository userRepository;

    // Tracking is scoped to (account, source-IP) pairs so that failed attempts from
    // one client never lock out the account globally (prevents targeted lockout DoS).
    private final ConcurrentHashMap<String, Deque<Long>> attemptTimes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lockedUntil = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> lockEscalations = new ConcurrentHashMap<>();

    private String key(String email, String ip) {
        return (email == null ? "" : email.trim().toLowerCase()) + "|" + (ip == null ? "" : ip);
    }

    public void loginSucceeded(String email, String ip) {
        String prefix = (email == null ? "" : email.trim().toLowerCase()) + "|";
        attemptTimes.keySet().removeIf(k -> k.startsWith(prefix));
        lockedUntil.keySet().removeIf(k -> k.startsWith(prefix));
        lockEscalations.keySet().removeIf(k -> k.startsWith(prefix));
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
        });
    }

    public void loginFailed(String email, String ip) {
        String k = key(email, ip);
        evictIfNeeded();

        long now = System.currentTimeMillis();
        Long until = lockedUntil.get(k);
        if (until != null) {
            if (until > now) {
                // Already locked for this (account, IP): extend with exponential backoff
                int esc = Math.min(MAX_ESCALATIONS, lockEscalations.merge(k, 1, Integer::sum));
                long duration = Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * (1L << esc));
                lockedUntil.put(k, now + duration);
                return;
            }
            lockedUntil.remove(k);
            lockEscalations.remove(k);
        }

        Deque<Long> times = attemptTimes.computeIfAbsent(k, kk -> new ArrayDeque<>());
        synchronized (times) {
            times.addLast(now);
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MS) {
                times.removeFirst();
            }
            if (times.size() >= MAX_ATTEMPTS) {
                lockedUntil.put(k, now + BASE_LOCKOUT_MS);
                times.clear();
            }
        }
    }

    /**
     * A request is blocked only if this specific (account, IP) pair is locked,
     * or if an administrator manually locked the whole account.
     */
    public boolean isBlocked(String email, String ip) {
        String k = key(email, ip);
        Long until = lockedUntil.get(k);
        if (until != null) {
            if (until > System.currentTimeMillis()) {
                return true;
            }
            lockedUntil.remove(k);
            lockEscalations.remove(k);
        }
        return userRepository.findByEmail(email)
                .map(user -> !user.isAccountNonLocked())
                .orElse(false);
    }

    private void evictIfNeeded() {
        if (attemptTimes.size() + lockedUntil.size() < MAX_TRACKED_KEYS) {
            return;
        }
        // Simple bounded eviction: drop the oldest half of tracked attempt buckets.
        attemptTimes.keySet().stream()
                .limit(attemptTimes.size() / 2)
                .forEach(attemptTimes::remove);
    }
}