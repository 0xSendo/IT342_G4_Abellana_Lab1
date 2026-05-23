package com.example.internmatch.data.model

data class ApplicationResponse(
    val id: Long,
    val studentId: Long,
    val studentName: String,
    val internshipTitle: String,
    val company: String,
    val status: String,
    val appliedAt: String
)

data class ConnectionRequest(
    val id: Long,
    val requesterId: Long,
    val requesterName: String,
    val requesterRole: String,
    val createdAt: String
)

data class FriendResponse(
    val id: Long,
    val name: String,
    val role: String,
    val email: String,
    val companyName: String = "",
    val program: String = ""
)
