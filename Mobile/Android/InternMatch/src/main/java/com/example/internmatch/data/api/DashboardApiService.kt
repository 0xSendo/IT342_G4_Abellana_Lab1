package com.example.internmatch.data.api

import com.example.internmatch.data.model.ApplicationResponse
import com.example.internmatch.data.model.CommunityPostResponse
import com.example.internmatch.data.model.ConnectionRequest
import com.example.internmatch.data.model.FriendResponse
import com.example.internmatch.data.model.NotificationResponse
import com.example.internmatch.data.model.PostRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface DashboardApiService {
    @GET("api/applications/my-applications")
    suspend fun getMyApplications(
        @Header("Authorization") token: String
    ): Response<List<ApplicationResponse>>

    @GET("api/connections/pending")
    suspend fun getPendingRequests(
        @Header("Authorization") token: String
    ): Response<List<ConnectionRequest>>

    @GET("api/connections/friends")
    suspend fun getFriends(
        @Header("Authorization") token: String
    ): Response<List<FriendResponse>>

    @PUT("api/connections/respond/{connectionId}")
    suspend fun respondToRequest(
        @Header("Authorization") token: String,
        @Path("connectionId") connectionId: Long,
        @Query("status") status: String
    ): Response<Unit>

    // Community Feed
    @GET("api/community/all")
    suspend fun getAllPosts(
        @Header("Authorization") token: String
    ): Response<List<CommunityPostResponse>>

    @POST("api/community/post")
    suspend fun createPost(
        @Header("Authorization") token: String,
        @Body request: PostRequest
    ): Response<CommunityPostResponse>

    // Notifications
    @GET("api/notifications")
    suspend fun getNotifications(
        @Header("Authorization") token: String
    ): Response<List<NotificationResponse>>

    @PUT("api/notifications/{id}/read")
    suspend fun markAsRead(
        @Header("Authorization") token: String,
        @Path("id") id: Long
    ): Response<Unit>
}
