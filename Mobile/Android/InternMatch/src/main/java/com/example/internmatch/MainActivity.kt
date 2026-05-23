package com.example.internmatch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.internmatch.ui.auth.AuthViewModel
import com.example.internmatch.ui.login.LoginScreen
import com.example.internmatch.ui.register.RegisterScreen
import com.example.internmatch.ui.theme.InternMatchTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            InternMatchTheme {
                val authViewModel: AuthViewModel = viewModel()
                var currentScreen by remember { mutableStateOf("login") }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    when (currentScreen) {
                        "login" -> LoginScreen(
                            viewModel = authViewModel,
                            onLoginSuccess = { 
                                currentScreen = "home" 
                            },
                            onRegisterClick = { 
                                authViewModel.clearError()
                                currentScreen = "register" 
                            }
                        )
                        "register" -> RegisterScreen(
                            viewModel = authViewModel,
                            onRegisterSuccess = { 
                                currentScreen = "login" 
                            },
                            onLoginClick = { 
                                authViewModel.clearError()
                                currentScreen = "login" 
                            }
                        )
                        "home" -> {
                            // Placeholder for Home/Dashboard
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = "Welcome, ${authViewModel.authResponse?.name}!",
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}