package com.internmatch.internmatch.features.common.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
public class GlobalErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Map<String, Object> errorResponse = new HashMap<>();
        
        Object statusAttr = request.getAttribute("jakarta.servlet.error.status_code");
        int status = (statusAttr instanceof Integer) ? (int) statusAttr : 500;
        
        Object messageAttr = request.getAttribute("jakarta.servlet.error.message");
        String message = (messageAttr != null) ? String.valueOf(messageAttr) : "An error occurred";
        
        Object exceptionAttr = request.getAttribute("jakarta.servlet.error.exception");
        String exception = (exceptionAttr != null) ? String.valueOf(exceptionAttr) : null;
        
        Object uriAttr = request.getAttribute("jakarta.servlet.error.request_uri");
        String requestUri = (uriAttr != null) ? String.valueOf(uriAttr) : "unknown";
        
        errorResponse.put("status", status);
        errorResponse.put("error", HttpStatus.valueOf(status).getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("path", requestUri);
        
        if (exception != null) {
            errorResponse.put("exception", exception);
        }
        
        return ResponseEntity
                .status(status)
                .body(errorResponse);
    }
}
