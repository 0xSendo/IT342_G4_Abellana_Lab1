package com.internmatch.internmatch.features.common.community;

/**
 * Business-rule failure within the community feature. Messages are safe to
 * surface to end users.
 */
public class CommunityException extends RuntimeException {
    public CommunityException(String message) {
        super(message);
    }
}