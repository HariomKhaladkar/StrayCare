package com.straycare.app.data.network

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    // ✅ PRODUCTION: Railway deployment URL
    // 🔁 Replace this with your actual Railway URL after deploying
    const val BASE_URL = "https://straycare-backend.up.railway.app/"

    // 🔧 LOCAL DEV (uncomment to test locally, comment out above):
    // const val BASE_URL = "http://10.0.2.2:8000/"  // Android emulator → localhost
    // const val BASE_URL = "http://YOUR_PC_IP:8000/" // Physical device → your PC

    private val authInterceptor = Interceptor { chain ->
        val requestBuilder = chain.request().newBuilder()
        TokenManager.getToken()?.let { token ->
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        chain.proceed(requestBuilder.build())
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)   // Increased for cloud cold starts
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val apiService: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }
}
