package com.internmatch.internmatch.features.common.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from InternMatch backend! Server is running 🚀";
    }

    @GetMapping("/")
    public String root() {
        return "Welcome to InternMatch API. Try /hello or /api/auth/register";
    }
}
