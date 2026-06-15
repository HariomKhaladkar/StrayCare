package com.straycare.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.models.RegisterRequest
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(onLoginSuccess: () -> Unit, onNgoLogin: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showRegisterDialog by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize().background(
        Brush.verticalGradient(listOf(Color(0xFF0D0D1F), Color(0xFF1A1040), Color(0xFF0F0F1A)))
    )) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo
            Box(
                modifier = Modifier.size(90.dp).clip(RoundedCornerShape(24.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))),
                contentAlignment = Alignment.Center
            ) { Text("🐾", fontSize = 44.sp) }

            Spacer(modifier = Modifier.height(20.dp))
            Text("StrayCare", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
            Text("Rescue · Adopt · Recover", color = Color(0xFF8B5CF6), fontSize = 14.sp, fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(top = 4.dp, bottom = 36.dp))

            // Email
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                label = { Text("Email Address") },
                leadingIcon = { Icon(Icons.Filled.Email, null, tint = Color(0xFF8B5CF6)) },
                modifier = Modifier.fillMaxWidth(), singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E),
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                    focusedLabelColor = Color(0xFF8B5CF6), unfocusedLabelColor = Color.Gray
                ), shape = RoundedCornerShape(14.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Password
            OutlinedTextField(
                value = password, onValueChange = { password = it },
                label = { Text("Password") },
                leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Color(0xFF8B5CF6)) },
                trailingIcon = {
                    TextButton(onClick = { showPassword = !showPassword }) {
                        Text(if (showPassword) "Hide" else "Show", color = Color(0xFF8B5CF6), fontSize = 12.sp)
                    }
                },
                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(), singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E),
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                    focusedLabelColor = Color(0xFF8B5CF6), unfocusedLabelColor = Color.Gray
                ), shape = RoundedCornerShape(14.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))

            // Error
            errorMessage?.let {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.1f)),
                    shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    Text("❌ $it", color = Color(0xFFEF4444), modifier = Modifier.padding(12.dp), fontSize = 13.sp)
                }
            }

            // Sign In Button
            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) { errorMessage = "Please fill in all fields."; return@Button }
                    isLoading = true; errorMessage = null
                    coroutineScope.launch {
                        try {
                            val response = ApiClient.apiService.login(email.trim(), password)
                            if (response.isSuccessful) {
                                val body = response.body()
                                body?.access_token?.let { TokenManager.saveToken(it) }
                                body?.user?.let { user ->
                                    val role = if (user.is_admin == true) "Admin" else "Citizen"
                                    TokenManager.saveUser(user.name, user.email, role)
                                }
                                onLoginSuccess()
                            } else { errorMessage = "Invalid credentials. Please try again." }
                        } catch (_: Exception) { errorMessage = "Network error. Is the server running?" }
                        finally { isLoading = false }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6), disabledContainerColor = Color(0xFF4B4B7A)),
                enabled = !isLoading
            ) {
                if (isLoading) CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Sign In", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(20.dp))
            HorizontalDivider(color = Color(0xFF2E2E4E))
            Spacer(modifier = Modifier.height(20.dp))

            // NGO Portal Button
            OutlinedButton(
                onClick = onNgoLogin,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF8B5CF6))
            ) { Text("🏥  NGO Portal →", color = Color(0xFF8B5CF6), fontWeight = FontWeight.SemiBold) }

            Spacer(modifier = Modifier.height(24.dp))

            // Register link
            TextButton(onClick = { showRegisterDialog = true }) {
                Text("Don't have an account? ", color = Color(0xFF8B8BA7), fontSize = 14.sp)
                Text("Register →", color = Color(0xFF8B5CF6), fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    if (showRegisterDialog) {
        RegisterDialog(
            onDismiss = { showRegisterDialog = false },
            onRegistered = {
                showRegisterDialog = false
                // Auto-fill email after registration
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterDialog(onDismiss: () -> Unit, onRegistered: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isLoading) onDismiss() }) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(24.dp)) {
            Column(modifier = Modifier.padding(24.dp)) {
                if (isSuccess) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("🎉", fontSize = 52.sp)
                        Spacer(Modifier.height(14.dp))
                        Text("Welcome to StrayCare!", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, textAlign = TextAlign.Center)
                        Text("Your account is ready. You can now sign in to report stray animals, adopt pets, and make a difference!", color = Color(0xFF94A3B8), fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                        Spacer(Modifier.height(20.dp))
                        Button(onClick = onRegistered, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                            Text("Sign In Now", fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    Text("Create Account", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                    Text("Join thousands helping stray animals", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp, bottom = 18.dp))

                    // Name field
                    OutlinedTextField(
                        value = name, onValueChange = { name = it },
                        label = { Text("Full Name", color = Color.Gray) },
                        leadingIcon = { Icon(Icons.Filled.Person, null, tint = Color(0xFF8B5CF6)) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = email, onValueChange = { email = it },
                        label = { Text("Email Address", color = Color.Gray) },
                        leadingIcon = { Icon(Icons.Filled.Email, null, tint = Color(0xFF8B5CF6)) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = password, onValueChange = { password = it },
                        label = { Text("Password", color = Color.Gray) },
                        leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Color(0xFF8B5CF6)) },
                        visualTransformation = PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = confirmPassword, onValueChange = { confirmPassword = it },
                        label = { Text("Confirm Password", color = Color.Gray) },
                        leadingIcon = { Icon(Icons.Filled.Lock, null, tint = if (confirmPassword == password && confirmPassword.isNotEmpty()) Color(0xFF22C55E) else Color(0xFF8B5CF6)) },
                        visualTransformation = PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                            focusedBorderColor = if (confirmPassword == password && confirmPassword.isNotEmpty()) Color(0xFF22C55E) else Color(0xFF8B5CF6),
                            unfocusedBorderColor = Color(0xFF2A2A3E)
                        ),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )

                    errorMsg?.let {
                        Spacer(Modifier.height(8.dp))
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.1f)), shape = RoundedCornerShape(8.dp)) {
                            Text("⚠️ $it", color = Color(0xFFEF4444), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                        }
                    }

                    Spacer(Modifier.height(18.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(onClick = { if (!isLoading) onDismiss() }, modifier = Modifier.weight(1f)) {
                            Text("Cancel", color = Color.Gray)
                        }
                        Button(
                            onClick = {
                                when {
                                    name.isBlank() -> errorMsg = "Please enter your full name."
                                    email.isBlank() -> errorMsg = "Please enter your email."
                                    !email.contains("@") -> errorMsg = "Please enter a valid email."
                                    password.length < 6 -> errorMsg = "Password must be at least 6 characters."
                                    password != confirmPassword -> errorMsg = "Passwords do not match."
                                    else -> {
                                        isLoading = true; errorMsg = null
                                        coroutineScope.launch {
                                            try {
                                                val res = ApiClient.apiService.registerUser(RegisterRequest(name.trim(), email.trim(), password))
                                                when {
                                                    res.isSuccessful -> isSuccess = true
                                                    res.code() == 400 -> errorMsg = "Email already registered. Try signing in."
                                                    else -> errorMsg = "Registration failed. Please try again."
                                                }
                                            } catch (_: Exception) { errorMsg = "Network error. Is the server running?" }
                                            finally { isLoading = false }
                                        }
                                    }
                                }
                            },
                            enabled = !isLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isLoading) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("Register", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
