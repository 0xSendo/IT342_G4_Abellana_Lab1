package com.example.internmatch.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.internmatch.data.api.RetrofitClient
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.data.model.LoginRequest
import com.example.internmatch.data.model.RegisterRequest
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var authResponse by mutableStateOf<AuthResponse?>(null)
    var registrationSuccess by mutableStateOf(false)

    fun login(request: LoginRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val response = RetrofitClient.authApiService.login(request)
                if (response.isSuccessful) {
                    authResponse = response.body()
                    onSuccess()
                } else {
                    errorMessage = response.errorBody()?.string() ?: "Login failed"
                }
            } catch (e: Exception) {
                errorMessage = e.message ?: "An unexpected error occurred"
            } finally {
                isLoading = false
            }
        }
    }

    fun register(request: RegisterRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val response = RetrofitClient.authApiService.register(request)
                if (response.isSuccessful) {
                    registrationSuccess = true
                    onSuccess()
                } else {
                    errorMessage = response.errorBody()?.string() ?: "Registration failed"
                }
            } catch (e: Exception) {
                errorMessage = e.message ?: "An unexpected error occurred"
            } finally {
                isLoading = false
            }
        }
    }

    fun clearError() {
        errorMessage = null
    }
}
