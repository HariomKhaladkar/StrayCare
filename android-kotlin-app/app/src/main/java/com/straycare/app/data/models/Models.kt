package com.straycare.app.data.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginResponse(
    val access_token: String,
    val token_type: String,
    val user: User? = null
)

data class StatsSummary(
    val total_cases: Int,
    val resolved_cases: Int,
    val active_cases: Int,
    val total_adoptions: Int,
    val available_pets: Int,
    val ngo_count: Int
)

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: String? = "Citizen",
    val points: Int? = 0,
    val is_admin: Boolean? = false
)

data class RecoveryStory(
    val id: Int,
    val title: String?,
    val description: String?,
    val image_url: String?,
    val date_posted: String?
)

data class FoodItem(
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val image_url: String?
)

data class NgoProfile(
    val id: Int,
    val name: String? = null,
    val ngo_name: String? = null,
    val email: String? = null,
    val location: String? = null,
    val contact_number: String? = null,
    val description: String? = null,
    val is_verified: Boolean? = false
)

data class NgoLoginResponse(
    val access_token: String,
    val token_type: String,
    val ngo: NgoProfile? = null
)

data class Case(
    val id: Int,
    val description: String?,
    val latitude: Double,
    val longitude: Double,
    val photo_url: String?,
    val status: String?,
    val severity_score: Int?,
    val severity_label: String?,
    val created_at: String?,
    val owner_id: Int?,
    val accepted_by_ngo_id: Int?
)

data class CaseUpdate(
    val id: Int,
    val notes: String,
    val photo_url: String?,
    val created_at: String?
)

data class Pet(
    val id: Int,
    val name: String,
    val species: String,
    val breed: String,
    val age: String,
    val gender: String,
    val size: String,
    val location: String,
    val is_vaccinated: Boolean,
    val status: String,
    val ngo_id: Int,
    val image_url: String,
    val video_url: String?
)

data class MatchProfile(
    val living_space: String,
    val activity_level: String,
    val has_kids: Boolean
)

data class PetMatchResponse(
    val pet: Pet,
    val match_percentage: Int
)
data class ChatMessage(val role: String, val text: String)
data class ChatQuery(val query: String, val history: List<ChatMessage> = emptyList())
data class ChatResponse(val response: String)

data class FoodOrder(
    val id: Int,
    val product_name: String?,
    val quantity: Int,
    val total_price: Double,
    val delivery_address: String?,
    val status: String?,
    val ordered_at: String?
)

data class RazorpayOrderRequest(
    val amount: Double,
    val ngo_id: Int
)

data class RazorpayOrderResponse(
    val order_id: String,
    val amount: Int,
    val currency: String
)

data class RazorpayVerifyRequest(
    val payment_id: String,
    val order_id: String,
    val signature: String
)

// -- NGO Module Models --
data class AdoptionRequest(
    val id: Int,
    val pet_id: Int,
    val user_id: Int,
    val status: String?,
    val created_at: String?,
    val pet: Pet? = null,
    val user_name: String? = null,
    val living_space: String? = null,
    val has_kids: Boolean? = null
)

data class PetListing(
    val id: Int,
    val pet_name: String?,
    val species: String?,
    val breed: String?,
    val age: String?,
    val location: String?,
    val status: String?,
    val submitted_by: String? = null,
    val created_at: String? = null
)

data class NgoNotification(
    val id: Int,
    val message: String?,
    val is_read: Boolean,
    val created_at: String?
)

// NGO Analytics
data class TimeCount(val label: String, val count: Int)
data class TimeAmount(val label: String, val amount: Double)
data class SpeciesCount(val species: String, val count: Int)

// -- Admin Module Models --
data class AdminCaseStats(
    val total: Int,
    val pending: Int,
    val accepted: Int,
    val resolved: Int,
    val monthwise: List<TimeCount>
)

data class AdminDonationStats(
    val total_amount: Double,
    val monthwise: List<TimeAmount>
)

data class AdminAdoptionStats(
    val total_adopted: Int,
    val available_pets: Int,
    val monthwise: List<TimeCount>
)

// Smart Dispatch
data class DispatchRecommendation(
    val ngo_id: Int,
    val ngo_name: String?,
    val proximity_score: Double,
    val caseload_score: Double,
    val total_score: Double,
    val distance_km: Double,
    val active_cases: Int
)

data class AdminFoodOrder(
    val id: Int,
    val product_name: String?,
    val quantity: Int,
    val total_price: Double,
    val delivery_address: String?,
    val status: String?,
    val ordered_at: String?,
    val user_name: String? = null
)

data class StatusUpdateRequest(val status: String)

// -- Admin Hotspot Map Models --
data class HotspotCluster(
    val cluster_id: Int,
    val center_lat: Double,
    val center_lon: Double,
    val case_count: Int,
    val radius_km: Double
)

data class HotspotMarker(
    val id: Int,
    val lat: Double,
    val lon: Double,
    val severity_label: String,
    val description: String,
    val status: String
)

data class HotspotResponse(
    val total_cases_mapped: Int,
    val clusters: List<HotspotCluster>,
    val markers: List<HotspotMarker>
)

data class FirstAidArticle(
    val id: Int,
    val title: String,
    val summary: String,
    val category: String,
    val animal_type: String,
    val image_url: String?
)

data class FirstAidArticleDetail(
    val id: Int,
    val title: String,
    val summary: String,
    val content: String,
    val dos: List<String>,
    val donts: List<String>,
    val video_url: String?,
    val image_url: String?
)
