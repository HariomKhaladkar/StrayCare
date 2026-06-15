package com.straycare.app.ui.auth

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NgoLoginScreen(onLoginSuccess: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var selectedMode by remember { mutableStateOf(0) } // 0=login, 1=register

    Box(
        modifier = Modifier.fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D1F), Color(0xFF1A1040), Color(0xFF0F0F1A))))
    ) {
        LazyColumn(
            contentPadding = PaddingValues(32.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxSize()
        ) {
            item { Spacer(Modifier.height(40.dp)) }

            // Logo & Title
            item {
                Box(
                    Modifier.size(80.dp).clip(RoundedCornerShape(24.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))),
                    contentAlignment = Alignment.Center
                ) { Text("🏥", fontSize = 40.sp) }
                Spacer(Modifier.height(16.dp))
                Text("NGO Portal", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
                Text("Login or apply to join as a rescue partner", color = Color(0xFF8B5CF6), fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 24.dp))
            }

            // Mode Switcher
            item {
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF1A1A2E))
                        .padding(4.dp)
                ) {
                    listOf("Login", "Register as NGO").forEachIndexed { i, label ->
                        Box(
                            modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                .background(if (selectedMode == i) Color(0xFF8B5CF6) else Color.Transparent)
                                .clickable { selectedMode = i }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, color = if (selectedMode == i) Color.White else Color.Gray,
                                fontWeight = if (selectedMode == i) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 14.sp)
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
            }

            if (selectedMode == 0) {
                item { NgoLoginForm(onLoginSuccess = onLoginSuccess, coroutineScope = coroutineScope) }
            } else {
                item { NgoRegisterForm(onRegistered = { selectedMode = 0 }, coroutineScope = coroutineScope) }
            }

            item { Spacer(Modifier.height(40.dp)) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NgoLoginForm(onLoginSuccess: () -> Unit, coroutineScope: kotlinx.coroutines.CoroutineScope) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(
            value = email, onValueChange = { email = it },
            label = { Text("NGO Email") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
            leadingIcon = { Icon(Icons.Filled.Email, null, tint = Color(0xFF8B5CF6)) },
            colors = ngoFieldColors(), shape = RoundedCornerShape(14.dp)
        )
        OutlinedTextField(
            value = password, onValueChange = { password = it },
            label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Color(0xFF8B5CF6)) },
            colors = ngoFieldColors(), shape = RoundedCornerShape(14.dp)
        )

        errorMessage?.let {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.1f)), shape = RoundedCornerShape(10.dp)) {
                Text("❌ $it", color = Color(0xFFEF4444), modifier = Modifier.padding(12.dp), fontSize = 13.sp)
            }
        }

        // Unverified info
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF6366F1).copy(0.08f)), shape = RoundedCornerShape(12.dp)) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("ℹ️", fontSize = 16.sp)
                Spacer(Modifier.width(8.dp))
                Text("Login requires admin approval. New NGOs must register and await verification.", color = Color(0xFF94A3B8), fontSize = 12.sp, lineHeight = 18.sp)
            }
        }

        Button(
            onClick = {
                if (email.isNotBlank() && password.isNotBlank()) {
                    isLoading = true; errorMessage = null
                    coroutineScope.launch {
                        try {
                            val response = ApiClient.apiService.loginNgo(email, password)
                            if (response.isSuccessful) {
                                val body = response.body()
                                body?.access_token?.let { TokenManager.saveToken(it) }
                                val ngoName = email.substringBefore("@").split(".", "_", "-")
                                    .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                                TokenManager.saveUser(ngoName, email, "NGO")
                                onLoginSuccess()
                            } else {
                                errorMessage = when {
                                    response.code() == 403 -> "Your NGO is pending admin approval."
                                    else -> "Invalid credentials. Please try again."
                                }
                            }
                        } catch (_: Exception) { errorMessage = "Network error. Is the server running?" }
                        finally { isLoading = false }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(10.dp))
                Text("Logging in...", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            } else { Text("🏥  Login as NGO", fontSize = 16.sp, fontWeight = FontWeight.Bold) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NgoRegisterForm(onRegistered: () -> Unit, coroutineScope: kotlinx.coroutines.CoroutineScope) {
    val context = LocalContext.current
    var ngoName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var selectedDocUri by remember { mutableStateOf<Uri?>(null) }
    var selectedDocName by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }

    val docPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            selectedDocUri = it
            selectedDocName = it.lastPathSegment ?: "document.pdf"
        }
    }

    if (isSuccess) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Box(Modifier.size(80.dp).clip(CircleShape).background(Color(0xFF22C55E).copy(0.15f)), contentAlignment = Alignment.Center) {
                Text("✅", fontSize = 40.sp)
            }
            Spacer(Modifier.height(16.dp))
            Text("Application Submitted!", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, textAlign = TextAlign.Center)
            Spacer(Modifier.height(10.dp))
            Text("Your NGO registration has been submitted for review. An admin will verify your documents and approve your account. You'll be able to login once approved.", color = Color(0xFF94A3B8), fontSize = 13.sp, textAlign = TextAlign.Center, lineHeight = 20.sp)
            Spacer(Modifier.height(12.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) { Text("⏱️", fontSize = 16.sp); Spacer(Modifier.width(8.dp)); Text("Review typically takes 24–48 hours", color = Color.Gray, fontSize = 12.sp) }
                    Spacer(Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) { Text("📧", fontSize = 16.sp); Spacer(Modifier.width(8.dp)); Text("You'll be notified once approved", color = Color.Gray, fontSize = 12.sp) }
                }
            }
            Spacer(Modifier.height(20.dp))
            OutlinedButton(onClick = onRegistered, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF8B5CF6))) {
                Text("← Back to Login", color = Color(0xFF8B5CF6), fontWeight = FontWeight.Bold)
            }
        }
        return
    }

    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Apply as NGO Partner", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text("Fill in your details. Admin will review and approve your application.", color = Color.Gray, fontSize = 12.sp)

        OutlinedTextField(
            value = ngoName, onValueChange = { ngoName = it },
            label = { Text("NGO / Organisation Name") },
            leadingIcon = { Icon(Icons.Filled.Person, null, tint = Color(0xFF8B5CF6)) },
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            colors = ngoFieldColors(), shape = RoundedCornerShape(12.dp)
        )
        OutlinedTextField(
            value = email, onValueChange = { email = it },
            label = { Text("Official Email") },
            leadingIcon = { Icon(Icons.Filled.Email, null, tint = Color(0xFF8B5CF6)) },
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            colors = ngoFieldColors(), shape = RoundedCornerShape(12.dp)
        )
        OutlinedTextField(
            value = password, onValueChange = { password = it },
            label = { Text("Create Password") },
            visualTransformation = PasswordVisualTransformation(),
            leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Color(0xFF8B5CF6)) },
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            colors = ngoFieldColors(), shape = RoundedCornerShape(12.dp)
        )
        OutlinedTextField(
            value = confirmPassword, onValueChange = { confirmPassword = it },
            label = { Text("Confirm Password") },
            visualTransformation = PasswordVisualTransformation(),
            leadingIcon = { Icon(Icons.Filled.Lock, null, tint = if (confirmPassword == password && confirmPassword.isNotEmpty()) Color(0xFF22C55E) else Color(0xFF8B5CF6)) },
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            colors = ngoFieldColors(), shape = RoundedCornerShape(12.dp)
        )

        // Document picker
        Text("Verification Document (PDF/Image)", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Box(
            modifier = Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .border(1.dp, if (selectedDocUri != null) Color(0xFF22C55E) else Color(0xFF2A2A3E), RoundedCornerShape(12.dp))
                .background(Color(0xFF1A1A2E))
                .clickable { docPicker.launch("*/*") }
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (selectedDocUri != null) "📄" else "📁", fontSize = 22.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        if (selectedDocUri != null) "Document selected" else "Tap to upload registration certificate",
                        color = if (selectedDocUri != null) Color(0xFF22C55E) else Color(0xFF94A3B8),
                        fontWeight = FontWeight.Medium, fontSize = 13.sp
                    )
                    if (selectedDocName != null) {
                        Text(selectedDocName ?: "", color = Color.Gray, fontSize = 11.sp, maxLines = 1)
                    }
                }
            }
        }

        // Info card
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF59E0B).copy(0.08f)), shape = RoundedCornerShape(10.dp)) {
            Row(Modifier.padding(12.dp)) {
                Text("⚠️", fontSize = 14.sp)
                Spacer(Modifier.width(8.dp))
                Text("NGO registration requires admin approval. Your account will be activated only after document verification.", color = Color(0xFFF59E0B), fontSize = 12.sp, lineHeight = 18.sp)
            }
        }

        errorMsg?.let {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.1f)), shape = RoundedCornerShape(8.dp)) {
                Text("❌ $it", color = Color(0xFFEF4444), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
            }
        }

        Button(
            onClick = {
                when {
                    ngoName.isBlank() -> errorMsg = "Please enter your NGO name."
                    email.isBlank() || !email.contains("@") -> errorMsg = "Please enter a valid email."
                    password.length < 6 -> errorMsg = "Password must be at least 6 characters."
                    password != confirmPassword -> errorMsg = "Passwords do not match."
                    selectedDocUri == null -> errorMsg = "Please upload a verification document."
                    else -> {
                        isLoading = true; errorMsg = null
                        coroutineScope.launch {
                            try {
                                val stream: InputStream? = context.contentResolver.openInputStream(selectedDocUri!!)
                                val bytes = stream?.readBytes() ?: byteArrayOf()
                                stream?.close()
                                val mimeType = context.contentResolver.getType(selectedDocUri!!) ?: "application/octet-stream"
                                val docBody = bytes.toRequestBody(mimeType.toMediaType())
                                val docPart = MultipartBody.Part.createFormData("document", selectedDocName ?: "doc.pdf", docBody)
                                val res = ApiClient.apiService.registerNgo(
                                    name = ngoName.trim().toRequestBody("text/plain".toMediaType()),
                                    email = email.trim().toRequestBody("text/plain".toMediaType()),
                                    password = password.toRequestBody("text/plain".toMediaType()),
                                    document = docPart
                                )
                                when {
                                    res.isSuccessful -> isSuccess = true
                                    res.code() == 400 -> errorMsg = "Email already registered."
                                    else -> errorMsg = "Registration failed. Please try again."
                                }
                            } catch (_: Exception) { errorMsg = "Network error. Is the server running?" }
                            finally { isLoading = false }
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(10.dp)); Text("Submitting Application...", fontWeight = FontWeight.Bold)
            } else { Text("🏥  Submit NGO Application", fontSize = 15.sp, fontWeight = FontWeight.Bold) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ngoFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E),
    focusedTextColor = Color.White, unfocusedTextColor = Color.White,
    focusedLabelColor = Color(0xFF8B5CF6), unfocusedLabelColor = Color.Gray
)
