package com.example.internmatch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.internmatch.ui.login.LoginScreen
import com.example.internmatch.ui.register.RegisterScreen
import com.example.internmatch.ui.theme.InternMatchTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            InternMatchTheme {
                var currentScreen by remember { mutableStateOf("login") }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    when (currentScreen) {
                        "login" -> LoginScreen(
                            onLoginClick = { /* Handle login */ },
                            onRegisterClick = { currentScreen = "register" }
                        )
                        "register" -> RegisterScreen(
                            onRegisterClick = { /* Handle register */ },
                            onLoginClick = { currentScreen = "login" }
                        )
                    }
                }
            }
        }
    }
}