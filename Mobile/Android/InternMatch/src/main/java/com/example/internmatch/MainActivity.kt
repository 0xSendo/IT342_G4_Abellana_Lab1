package com.example.internmatch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.internmatch.ui.auth.AuthViewModel
import com.example.internmatch.ui.login.LoginScreen
import com.example.internmatch.ui.register.RegisterScreen
import com.example.internmatch.ui.theme.InternMatchTheme

import com.example.internmatch.ui.student.StudentMainScreen
import com.example.internmatch.ui.student.StudentViewModel
import com.example.internmatch.ui.employer.EmployerMainScreen
import com.example.internmatch.ui.employer.EmployerViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            InternMatchTheme {
                val authViewModel: AuthViewModel = viewModel()
                val studentViewModel: StudentViewModel = viewModel()
                val employerViewModel: EmployerViewModel = viewModel()
                var currentScreen by remember { mutableStateOf("login") }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    when (currentScreen) {
                        "login" -> LoginScreen(
                            viewModel = authViewModel,
                            onLoginSuccess = { 
                                val user = authViewModel.authResponse
                                if (user != null) {
                                    if (user.role == "STUDENT") {
                                        currentScreen = "student_dashboard"
                                    } else if (user.role == "EMPLOYER") {
                                        currentScreen = "employer_dashboard"
                                    } else {
                                        currentScreen = "home"
                                    }
                                }
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
                        "student_dashboard" -> {
                            val user = authViewModel.authResponse
                            if (user != null) {
                                StudentMainScreen(
                                    user = user,
                                    viewModel = studentViewModel,
                                    token = user.token,
                                    onLogout = {
                                        authViewModel.authResponse = null
                                        currentScreen = "login"
                                    }
                                )
                            }
                        }
                        "employer_dashboard" -> {
                            val user = authViewModel.authResponse
                            if (user != null) {
                                EmployerMainScreen(
                                    user = user,
                                    viewModel = employerViewModel,
                                    token = user.token,
                                    onLogout = {
                                        authViewModel.authResponse = null
                                        currentScreen = "login"
                                    }
                                )
                            }
                        }
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