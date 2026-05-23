package com.example.internmatch.ui.student

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.internmatch.data.api.RetrofitClient
import com.example.internmatch.data.model.ApplicationResponse
import com.example.internmatch.data.model.ConnectionRequest
import com.example.internmatch.data.model.FriendResponse
import kotlinx.coroutines.launch

class StudentViewModel : ViewModel() {
    var applications by mutableStateOf<List<ApplicationResponse>>(emptyList())
    var pendingRequests by mutableStateOf<List<ConnectionRequest>>(emptyList())
    var friends by mutableStateOf<List<FriendResponse>>(emptyList())
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)

    fun fetchData(token: String) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val authToken = "Bearer $token"
                val appsDef = RetrofitClient.dashboardApiService.getMyApplications(authToken)
                val pendingDef = RetrofitClient.dashboardApiService.getPendingRequests(authToken)
                val friendsDef = RetrofitClient.dashboardApiService.getFriends(authToken)

                if (appsDef.isSuccessful) applications = appsDef.body() ?: emptyList()
                if (pendingDef.isSuccessful) pendingRequests = pendingDef.body() ?: emptyList()
                if (friendsDef.isSuccessful) friends = friendsDef.body() ?: emptyList()
                
            } catch (e: Exception) {
                errorMessage = e.message ?: "Failed to fetch dashboard data"
            } finally {
                isLoading = false
            }
        }
    }

    fun respondToRequest(token: String, connectionId: Long, status: String) {
        viewModelScope.launch {
            try {
                val authToken = "Bearer $token"
                val response = RetrofitClient.dashboardApiService.respondToRequest(authToken, connectionId, status)
                if (response.isSuccessful) {
                    fetchData(token) // Refresh data
                }
            } catch (e: Exception) {
                errorMessage = e.message
            }
        }
    }
}
