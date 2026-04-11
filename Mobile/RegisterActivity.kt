package com.example.auth

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class RegisterActivity : AppCompatActivity() {

    private lateinit var tilName: TextInputLayout
    private lateinit var tilEmail: TextInputLayout
    private lateinit var tilPassword: TextInputLayout
    private lateinit var etName: TextInputEditText
    private lateinit var etEmail: TextInputEditText
    private lateinit var etPassword: TextInputEditText
    private lateinit var btnRegister: MaterialButton
    private lateinit var tvSignIn: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        bindViews()
        setupListeners()
    }

    private fun bindViews() {
        tilName = findViewById(R.id.tilName)
        tilEmail = findViewById(R.id.tilEmail)
        tilPassword = findViewById(R.id.tilPassword)
        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnRegister = findViewById(R.id.btnRegister)
        tvSignIn = findViewById(R.id.tvSignIn)
    }

    private fun setupListeners() {
        btnRegister.setOnClickListener {
            if (validateInputs()) {
                performRegistration()
            }
        }

        tvSignIn.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        val name = etName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString()

        // Validate name
        if (name.isEmpty()) {
            tilName.error = "Name is required"
            isValid = false
        } else {
            tilName.error = null
        }

        // Validate email
        if (email.isEmpty()) {
            tilEmail.error = "Email is required"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            tilEmail.error = "Enter a valid email address"
            isValid = false
        } else {
            tilEmail.error = null
        }

        // Validate password
        if (password.isEmpty()) {
            tilPassword.error = "Password is required"
            isValid = false
        } else if (password.length < 8) {
            tilPassword.error = "Password must be at least 8 characters"
            isValid = false
        } else {
            tilPassword.error = null
        }

        return isValid
    }

    private fun performRegistration() {
        val name = etName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString()

        // TODO: Replace with your actual registration logic (e.g. API call, Firebase, etc.)
        // Example: authViewModel.register(name, email, password)

        // On success, navigate to the main screen or login
        // startActivity(Intent(this, MainActivity::class.java))
        // finish()
    }
}
