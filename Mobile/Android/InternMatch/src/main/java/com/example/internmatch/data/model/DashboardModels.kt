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

data class CommunityPostResponse(
    val id: Long,
    val studentId: Long?,
    val studentName: String,
    val studentProgram: String,
    val studentEmail: String,
    val studentBio: String?,
    val studentSkills: String?,
    val studentProjects: String?,
    val studentYearLevel: String?,
    val studentResumeUrl: String?,
    val content: String,
    val type: String,
    val createdAt: String
)

data class PostRequest(
    val content: String,
    val type: String
)

data class NotificationResponse(
    val id: Long,
    val title: String,
    val message: String,
    val type: String,
    val read: Boolean,
    val createdAt: String
)
