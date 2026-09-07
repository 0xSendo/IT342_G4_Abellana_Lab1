package com.internmatch.internmatch.features.connection;

/**
 * Business-rule failure within the connection feature. The message is intended
 * to be safe to display to end users.
 */
public class ConnectionException extends RuntimeException {
    public ConnectionException(String message) {
        super(message);
    }
}