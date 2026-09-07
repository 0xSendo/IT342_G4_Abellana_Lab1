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
    val studentEmail: String? = null,
    val studentBio: String? = null,
    val studentSkills: String? = null,
    val studentProjects: String? = null,
    val studentYearLevel: String? = null,
    val studentResumeUrl: String? = null,
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

data class InternshipResponse(
    val id: Long,
    val title: String,
    val description: String,
    val company: String,
    val location: String,
    val setup: String,
    val status: String,
    val startDate: String,
    val endDate: String,
    var applicants: Int = 0
)

data class ApplicantResponse(
    val id: Long,
    val name: String,
    val internship: String,
    val dateApplied: String,
    val status: String,
    val studentId: Long,
    val studentBio: String? = null,
    val studentSkills: String? = null,
    val studentProjects: String? = null,
    val studentProgram: String? = null,
    val studentYearLevel: String? = null,
    val studentResumeUrl: String? = null
)
