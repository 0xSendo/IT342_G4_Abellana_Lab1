package com.example.internmatch.data.api

import com.example.internmatch.data.model.ApplicationResponse
import com.example.internmatch.data.model.ConnectionRequest
import com.example.internmatch.data.model.FriendResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
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
}
