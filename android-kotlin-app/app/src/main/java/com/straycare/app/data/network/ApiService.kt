package com.straycare.app.data.network

import com.straycare.app.data.models.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
interface ApiService {

    @FormUrlEncoded
    @POST("token")
    suspend fun login(
        @Field("username") username: String,
        @Field("password") password: String
    ): Response<LoginResponse>

    @POST("users/register")
    suspend fun registerUser(@Body request: RegisterRequest): Response<User>

    @retrofit2.http.Multipart
    @POST("ngos/register")
    suspend fun registerNgo(
        @retrofit2.http.Part("name") name: okhttp3.RequestBody,
        @retrofit2.http.Part("email") email: okhttp3.RequestBody,
        @retrofit2.http.Part("password") password: okhttp3.RequestBody,
        @retrofit2.http.Part document: okhttp3.MultipartBody.Part
    ): Response<Map<String, String>>

    @GET("users/me")
    suspend fun getCurrentUser(): Response<User>

    @GET("users/me/cases")
    suspend fun getMyCases(): Response<List<Case>>

    @GET("cases/{case_id}")
    suspend fun getCaseDetail(@Path("case_id") caseId: Int): Response<Case>

    @GET("cases/{case_id}/updates")
    suspend fun getCaseUpdates(@Path("case_id") caseId: Int): Response<List<CaseUpdate>>

    @GET("pets/{pet_id}")
    suspend fun getPetDetail(@Path("pet_id") petId: Int): Response<Pet>

    @POST("adoption-requests/{pet_id}")
    suspend fun requestAdoption(@Path("pet_id") petId: Int): Response<Map<String, String>>

    @GET("users/me/adoption-requests")
    suspend fun getMyAdoptionRequests(): Response<List<AdoptionRequest>>

    @GET("donations/history")
    suspend fun getMyDonations(): Response<List<Map<String, String>>>

    @GET("stats/summary")
    suspend fun getStatsSummary(): Response<StatsSummary>

    @GET("stories")
    suspend fun getRecoveryStories(): Response<List<RecoveryStory>>

    @retrofit2.http.Multipart
    @POST("report")
    suspend fun reportCase(
        @retrofit2.http.Part photo: okhttp3.MultipartBody.Part,
        @retrofit2.http.Part("latitude") latitude: okhttp3.RequestBody,
        @retrofit2.http.Part("longitude") longitude: okhttp3.RequestBody,
        @retrofit2.http.Part("description") description: okhttp3.RequestBody
    ): Response<Case>

    @GET("food/products")
    suspend fun getFoodItems(): Response<List<FoodItem>>

    @GET("donations/ngos")
    suspend fun getNgoProfiles(): Response<List<NgoProfile>>

    @POST("donations/create-order")
    suspend fun createRazorpayOrder(@Body request: RazorpayOrderRequest): Response<RazorpayOrderResponse>

    @POST("donations/verify")
    suspend fun verifyRazorpayPayment(@Body request: RazorpayVerifyRequest): Response<Map<String, String>>

    @FormUrlEncoded
    @POST("ngo/token")
    suspend fun loginNgo(
        @Field("username") username: String,
        @Field("password") password: String
    ): Response<NgoLoginResponse>

    @GET("ngo/me/cases")
    suspend fun getNgoCases(): Response<List<Case>>

    @PUT("case/{case_id}/accept")
    suspend fun acceptCase(@Path("case_id") caseId: Int): Response<Case>

    @PUT("case/{case_id}/reject")
    suspend fun rejectCase(@Path("case_id") caseId: Int): Response<Case>

    @retrofit2.http.Multipart
    @POST("cases/{case_id}/updates")
    suspend fun postCaseUpdate(
        @Path("case_id") caseId: Int,
        @retrofit2.http.Part("notes") notes: okhttp3.RequestBody,
        @retrofit2.http.Part photo: okhttp3.MultipartBody.Part?
    ): Response<CaseUpdate>

    @retrofit2.http.Multipart
    @POST("ngo/stories")
    suspend fun postNgoStory(
        @retrofit2.http.Part("title") title: okhttp3.RequestBody,
        @retrofit2.http.Part("description") description: okhttp3.RequestBody,
        @retrofit2.http.Part("pet_name") petName: okhttp3.RequestBody,
        @retrofit2.http.Part photo: okhttp3.MultipartBody.Part?,
        @retrofit2.http.Part video: okhttp3.MultipartBody.Part?
    ): Response<Map<String, String>>

    @GET("pets")
    suspend fun getPets(): Response<List<Pet>>

    @POST("pets/match")
    suspend fun matchPets(@Body profile: MatchProfile): Response<List<PetMatchResponse>>

    @POST("chatbot/query")
    suspend fun queryChatbot(@Body query: ChatQuery): Response<ChatResponse>

    @GET("food/orders/me")
    suspend fun getFoodOrders(): Response<List<FoodOrder>>

    // ── NGO: Adoption Requests ──────────────────────────
    @GET("ngo/me/adoption-requests")
    suspend fun getNgoAdoptionRequests(): Response<List<AdoptionRequest>>

    @PUT("ngo/adoption-requests/{request_id}/status")
    suspend fun updateAdoptionRequestStatus(
        @Path("request_id") requestId: Int,
        @Body status: StatusUpdateRequest
    ): Response<AdoptionRequest>

    // ── NGO: Pet Listings Review ─────────────────────────
    @GET("ngo/pets/listings")
    suspend fun getPetListings(): Response<List<PetListing>>

    @PUT("ngo/pets/listings/{listing_id}/approve")
    suspend fun approvePetListing(@Path("listing_id") listingId: Int): Response<PetListing>

    @PUT("ngo/pets/listings/{listing_id}/reject")
    suspend fun rejectPetListing(@Path("listing_id") listingId: Int): Response<PetListing>

    // ── NGO: Notifications ───────────────────────────────
    @GET("ngo/notifications/me")
    suspend fun getNgoNotifications(): Response<List<NgoNotification>>

    @PUT("ngo/notifications/read")
    suspend fun markNotificationsRead(): Response<Map<String, String>>

    // ── NGO: Analytics ───────────────────────────────────
    @GET("ngo/dashboard/cases/monthwise")
    suspend fun getNgoCasesMonthwise(): Response<List<TimeCount>>

    @GET("ngo/dashboard/species")
    suspend fun getNgoSpecies(): Response<List<SpeciesCount>>

    @GET("ngo/dashboard/adoptions")
    suspend fun getNgoAdoptionStats(): Response<List<TimeCount>>

    @GET("ngo/dashboard/donations")
    suspend fun getNgoDonationStats(): Response<List<TimeAmount>>

    // ── Admin: NGO Management ────────────────────────────
    @GET("admin/ngos/pending")
    suspend fun getPendingNgos(): Response<List<NgoProfile>>

    @GET("admin/ngos")
    suspend fun getAllNgos(): Response<List<NgoProfile>>

    @PUT("admin/ngos/{ngo_id}/verify")
    suspend fun verifyNgo(@Path("ngo_id") ngoId: Int): Response<NgoProfile>

    @retrofit2.http.DELETE("admin/ngos/{ngo_id}")
    suspend fun deleteNgo(
        @Path("ngo_id") ngoId: Int,
        @Body reason: Map<String, String>
    ): Response<Map<String, String>>

    // ── Admin: Analytics ─────────────────────────────────
    @GET("admin/dashboard/cases")
    suspend fun getAdminCaseStats(): Response<AdminCaseStats>

    @GET("admin/dashboard/donations")
    suspend fun getAdminDonationStats(): Response<AdminDonationStats>

    @GET("admin/dashboard/adoptions")
    suspend fun getAdminAdoptionStats(): Response<AdminAdoptionStats>

    // ── Admin: Smart Dispatch ────────────────────────────
    @GET("admin/cases/pending-unassigned")
    suspend fun getUnassignedCases(): Response<List<Case>>

    @GET("admin/cases/{case_id}/dispatch")
    suspend fun getDispatchRecommendations(@Path("case_id") caseId: Int): Response<List<DispatchRecommendation>>

    @PUT("admin/cases/{case_id}/assign/{ngo_id}")
    suspend fun assignCase(
        @Path("case_id") caseId: Int,
        @Path("ngo_id") ngoId: Int
    ): Response<Case>

    // ── Admin: Food Orders ───────────────────────────────
    @GET("admin/food/orders")
    suspend fun getAdminFoodOrders(): Response<List<AdminFoodOrder>>

    @PUT("admin/food/orders/{order_id}/status")
    suspend fun updateFoodOrderStatus(
        @Path("order_id") orderId: Int,
        @Body status: StatusUpdateRequest
    ): Response<AdminFoodOrder>

    // ── Admin: Hotspot Map ───────────────────────────────
    @GET("admin/hotspots")
    suspend fun getAdminHotspots(@Query("k") k: Int = 5): Response<com.straycare.app.data.models.HotspotResponse>
}
