package com.internmatch.internmatch.features.common.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
public class GlobalErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Object statusAttr = request.getAttribute("jakarta.servlet.error.status_code");
        int status = (statusAttr instanceof Integer) ? (int) statusAttr : 500;

        Object exceptionAttr = request.getAttribute("jakarta.servlet.error.exception");
        if (exceptionAttr instanceof Throwable) {
            log.error("Unhandled error routed to /error", (Throwable) exceptionAttr);
        }

        String reasonPhrase;
        try {
            reasonPhrase = HttpStatus.valueOf(status).getReasonPhrase();
        } catch (IllegalArgumentException e) {
            reasonPhrase = "Error";
        }

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", status);
        errorResponse.put("error", reasonPhrase);
        errorResponse.put("message", "An unexpected error occurred.");
        errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

        return ResponseEntity
                .status(status)
                .body(errorResponse);
    }
}