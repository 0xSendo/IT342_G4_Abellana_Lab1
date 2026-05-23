package com.example.internmatch.ui.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase

object FirebaseAuthManager {
    private val auth: FirebaseAuth = Firebase.auth
    private const val WEB_CLIENT_ID = "YOUR_WEB_CLIENT_ID_HERE" // DO NOT COMMIT ACTUAL KEY

    suspend fun signInWithGoogle(context: Context): String? {
        val credentialManager = CredentialManager.create(context)

        val googleIdOption: GetGoogleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(WEB_CLIENT_ID)
            .setAutoSelectEnabled(true)
            .build()

        val request: GetCredentialRequest = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        return try {
            val result = credentialManager.getCredential(
                context = context,
                request = request
            )
            val credential = result.credential
            credential.data.getString("com.google.android.libraries.identity.googleid.BUNDLE_KEY_ID_TOKEN")
        } catch (e: Exception) {
            null
        }
    }

    fun getCurrentUser() = auth.currentUser
    fun signOut() = auth.signOut()
}
