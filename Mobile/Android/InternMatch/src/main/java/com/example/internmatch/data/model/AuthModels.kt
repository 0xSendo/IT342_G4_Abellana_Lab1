package com.example.internmatch.data.model

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String
)

data class AuthResponse(
    val token: String,
    val email: String,
    val name: String,
    val role: String,
    val program: String? = null,
    val yearLevel: String? = null,
    val skills: String? = null,
    val bio: String? = null,
    val projects: String? = null,
    val resumeUrl: String? = null,
    val linkedin: String? = null,
    val website: String? = null,
    val companyName: String? = null,
    val companyLocation: String? = null,
    val companyWebsite: String? = null,
    val department: String? = null,
    val phone: String? = null
)
