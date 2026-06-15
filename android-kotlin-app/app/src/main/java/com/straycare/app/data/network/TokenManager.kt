package com.straycare.app.data.network

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object TokenManager {
    private const val PREFS_NAME = "secure_prefs"
    private const val TOKEN_KEY = "jwt_token"
    private const val USER_NAME_KEY = "user_name"
    private const val USER_EMAIL_KEY = "user_email"

    private const val USER_ROLE_KEY = "user_role"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to standard SharedPreferences if KeyStore is broken on this device
            prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveToken(token: String) {
        prefs.edit().putString(TOKEN_KEY, token).apply()
    }

    fun getToken(): String? = prefs.getString(TOKEN_KEY, null)

    fun saveUser(name: String, email: String, role: String? = "Citizen") {
        prefs.edit()
            .putString(USER_NAME_KEY, name)
            .putString(USER_EMAIL_KEY, email)
            .putString(USER_ROLE_KEY, role)
            .apply()
    }

    fun getUserName(): String = prefs.getString(USER_NAME_KEY, "Citizen") ?: "Citizen"
    fun getUserEmail(): String = prefs.getString(USER_EMAIL_KEY, "") ?: ""
    fun getUserRole(): String = prefs.getString(USER_ROLE_KEY, "Citizen") ?: "Citizen"

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
