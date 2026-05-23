package com.example.internmatch.data.api

import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.data.model.LoginRequest
import com.example.internmatch.data.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<String>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}
