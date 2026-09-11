package com.example.internmatch.ui.employer

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.internmatch.data.api.RetrofitClient
import com.example.internmatch.data.model.*
import kotlinx.coroutines.launch

class EmployerViewModel : ViewModel() {
    var postings by mutableStateOf<List<InternshipResponse>>(emptyList())
    var applicants by mutableStateOf<List<ApplicantResponse>>(emptyList())
    var friends by mutableStateOf<List<FriendResponse>>(emptyList())
    var pendingRequests by mutableStateOf<List<ConnectionRequest>>(emptyList())
    var notifications by mutableStateOf<List<NotificationResponse>>(emptyList())
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)

    fun fetchData(token: String) {
        if (token == "mock_token_employer") {
            loadMockData()
            return
        }

        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val authToken = "Bearer $token"
                val postingsRes = RetrofitClient.dashboardApiService.getMyPostings(authToken)
                val friendsRes = RetrofitClient.dashboardApiService.getFriends(authToken)
                val pendingRes = RetrofitClient.dashboardApiService.getPendingRequests(authToken)
                val notesRes = RetrofitClient.dashboardApiService.getNotifications(authToken)

                if (postingsRes.isSuccessful) {
                    val rawPostings = postingsRes.body() ?: emptyList()
                    val allApplicants = mutableListOf<ApplicantResponse>()
                    
                    // Fetch applicants for each posting to get counts and the full list
                    val postingsWithCounts = rawPostings.map { p ->
                        val appsRes = RetrofitClient.dashboardApiService.getApplicantsForInternship(authToken, p.id)
                        if (appsRes.isSuccessful) {
                            val apps = appsRes.body() ?: emptyList()
                            apps.forEach { app ->
                                allApplicants.add(ApplicantResponse(
                                    id = app.id,
                                    name = app.studentName,
                                    internship = app.internshipTitle,
                                    dateApplied = app.appliedAt.split("T")[0],
                                    status = app.status,
                                    studentId = app.studentId
                                ))
                            }
                            p.copy(applicants = apps.size)
                        } else p
                    }
                    postings = postingsWithCounts
                    applicants = allApplicants
                }
                
                if (friendsRes.isSuccessful) friends = friendsRes.body() ?: emptyList()
                if (pendingRes.isSuccessful) pendingRequests = pendingRes.body() ?: emptyList()
                if (notesRes.isSuccessful) notifications = notesRes.body() ?: emptyList()

            } catch (e: Exception) {
                errorMessage = e.message ?: "Failed to fetch employer data"
            } finally {
                isLoading = false
            }
        }
    }

    private fun loadMockData() {
        postings = listOf(
            InternshipResponse(1, "Senior Android Intern", "Develop UI with Compose.", "Tech Corp", "Cebu", "Remote", "ACTIVE", "2026-05-01", "2026-08-01", 12),
            InternshipResponse(2, "Backend Developer", "Spring Boot and Postgres.", "Tech Corp", "Manila", "Hybrid", "ACTIVE", "2026-06-01", "2026-09-01", 8),
            InternshipResponse(3, "UI/UX Designer", "Design Figma prototypes.", "Tech Corp", "Remote", "Remote", "CLOSED", "2026-04-01", "2026-07-01", 15)
        )
        applicants = listOf(
            ApplicantResponse(1, "Juan Dela Cruz", "Senior Android Intern", "2026-05-20", "PENDING", 101, studentProgram = "BSIT"),
            ApplicantResponse(2, "Maria Clara", "Backend Developer", "2026-05-21", "SHORTLISTED", 102, studentProgram = "BSCS"),
            ApplicantResponse(3, "Simoun Ibarra", "UI/UX Designer", "2026-05-18", "ACCEPTED", 103, studentProgram = "BSIS")
        )
        friends = listOf(
            FriendResponse(1, "Juan Dela Cruz", "STUDENT", "juan@gmail.com", program = "BSIT"),
            FriendResponse(2, "Maria Clara", "STUDENT", "maria@gmail.com", program = "BSCS")
        )
        pendingRequests = listOf(
            ConnectionRequest(1, 105, "Ibarra Simoun", "STUDENT", "2026-05-24T10:00:00")
        )
        notifications = listOf(
            NotificationResponse(1, "New Application", "Juan Dela Cruz applied for Senior Android Intern.", "APPLICATION", false, "2026-05-24T09:00:00"),
            NotificationResponse(2, "Connection Request", "Ibarra Simoun wants to connect.", "CONNECTION", false, "2026-05-24T10:00:00")
        )
    }

    fun updateStatus(token: String, appId: Long, nextStatus: String) {
        viewModelScope.launch {
            try {
                if (token != "mock_token_employer") {
                    RetrofitClient.dashboardApiService.updateApplicationStatus("Bearer $token", appId, nextStatus)
                }
                fetchData(token)
            } catch (e: Exception) {
                errorMessage = e.message
            }
        }
    }

    fun respondToRequest(token: String, connectionId: Long, status: String) {
        viewModelScope.launch {
            try {
                if (token != "mock_token_employer") {
                    RetrofitClient.dashboardApiService.respondToRequest("Bearer $token", connectionId, status)
                }
                fetchData(token)
            } catch (e: Exception) {
                errorMessage = e.message
            }
        }
    }
}
