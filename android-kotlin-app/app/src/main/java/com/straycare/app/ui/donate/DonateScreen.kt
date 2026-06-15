package com.straycare.app.ui.donate

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.razorpay.Checkout
import com.straycare.app.data.models.NgoProfile
import com.straycare.app.data.models.RazorpayOrderRequest
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

// Helper: safely get Activity from any Compose Context
fun Context.findActivity(): Activity? {
    var ctx = this
    repeat(10) {
        if (ctx is Activity) return ctx as Activity
        ctx = (ctx as? ContextWrapper)?.baseContext ?: return null
    }
    return null
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonateScreen(onNavigateBack: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    var ngos by remember { mutableStateOf<List<NgoProfile>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedNgo by remember { mutableStateOf<NgoProfile?>(null) }
    var showDonateDialog by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        withContext(Dispatchers.IO) {
            Checkout.preload(context.applicationContext)
            try {
                val res = ApiClient.apiService.getNgoProfiles()
                if (res.isSuccessful) {
                    ngos = res.body() ?: emptyList()
                }
            } catch (_: Exception) {}
            finally { isLoading = false }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Donate to NGO", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1A1A2E))
            )
        },
        containerColor = Color(0xFF0F0F1A)
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1A40)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF22C55E).copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) { Text("🔒", fontSize = 20.sp) }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("100% Secure Payments", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Powered by Razorpay • UPI, Cards, NetBanking accepted", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    }
                }

                if (statusMessage.isNotBlank()) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (statusMessage.startsWith("✅")) Color(0xFF22C55E).copy(0.15f)
                                else Color(0xFFEF4444).copy(0.15f)
                            ),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                statusMessage,
                                color = if (statusMessage.startsWith("✅")) Color(0xFF22C55E) else Color(0xFFEF4444),
                                modifier = Modifier.padding(12.dp),
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                item {
                    Text(
                        "Choose a verified NGO to support. Every rupee goes directly to rescue and care for stray animals.",
                        color = Color(0xFFB0B0CC), fontSize = 14.sp, modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                if (ngos.isEmpty()) {
                    item { Text("No verified NGOs found.", color = Color.Gray) }
                } else {
                    items(ngos) { ngo ->
                        NgoCard(ngo = ngo, onDonate = { selectedNgo = ngo; showDonateDialog = true })
                    }
                }
            }
        }
    }

    if (showDonateDialog && selectedNgo != null) {
        DonateDialog(
            ngo = selectedNgo!!,
            onDismiss = { showDonateDialog = false },
            onPay = { amount ->
                showDonateDialog = false
                statusMessage = ""
                coroutineScope.launch(Dispatchers.IO) {
                    try {
                        // Step 1: Create order on backend
                        val orderRes = ApiClient.apiService.createRazorpayOrder(
                            RazorpayOrderRequest(amount = amount, ngo_id = selectedNgo!!.id)
                        )
                        if (!orderRes.isSuccessful || orderRes.body() == null) {
                            val errBody = orderRes.errorBody()?.string() ?: "Unknown error"
                            withContext(Dispatchers.Main) {
                                statusMessage = "❌ Payment failed: $errBody"
                            }
                            return@launch
                        }

                        val orderBody = orderRes.body()!!

                        // Step 2: Open Razorpay checkout on Main thread
                        withContext(Dispatchers.Main) {
                            val activity = context.findActivity()
                            if (activity == null) {
                                statusMessage = "❌ Cannot open payment screen. Please restart the app."
                                return@withContext
                            }
                            try {
                                val checkout = Checkout()
                                checkout.setKeyID("rzp_test_Sc28etyyVCB7jl")
                                checkout.setImage(android.R.drawable.ic_menu_compass)

                                val options = JSONObject().apply {
                                    put("name", "StrayCare")
                                    put("description", "Donation to ${selectedNgo!!.ngo_name ?: "NGO"}")
                                    put("currency", "INR")
                                    put("order_id", orderBody.order_id)
                                    put("amount", orderBody.amount)
                                    put("theme.color", "#F59E0B")
                                    put("prefill", JSONObject().apply {
                                        put("email", "donor@example.com")
                                        put("contact", "9999999999")
                                    })
                                }
                                checkout.open(activity, options)
                            } catch (e: Exception) {
                                statusMessage = "❌ Checkout error: ${e.message}"
                            }
                        }
                    } catch (e: Exception) {
                        withContext(Dispatchers.Main) {
                            statusMessage = "❌ Network error: ${e.message}"
                        }
                    }
                }
            }
        )
    }
}

@Composable
fun NgoCard(ngo: NgoProfile, onDonate: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFF59E0B).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) { Text("🏥", fontSize = 24.sp) }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(ngo.ngo_name ?: ngo.name ?: "Unknown NGO", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text("📍 ${ngo.location ?: "Location not specified"}", color = Color.Gray, fontSize = 12.sp)
                }
            }
            if (!ngo.description.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(ngo.description, color = Color.LightGray, fontSize = 13.sp, lineHeight = 18.sp)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onDonate,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            ) { Text("Donate Now 💛", color = Color.White, fontWeight = FontWeight.Bold) }
        }
    }
}

@Composable
fun DonateDialog(ngo: NgoProfile, onDismiss: () -> Unit, onPay: (Double) -> Unit) {
    var amount by remember { mutableStateOf("") }
    var selectedPreset by remember { mutableStateOf("") }

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier.size(56.dp).clip(CircleShape).background(Color(0xFFF59E0B).copy(0.15f)),
                    contentAlignment = Alignment.Center
                ) { Text("💛", fontSize = 28.sp) }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Donate to ${ngo.ngo_name ?: ngo.name ?: "NGO"}",
                    color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center
                )
                Text("Your payment is secured by Razorpay", color = Color.Gray, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(24.dp))

                Text("Quick amounts", color = Color.LightGray, modifier = Modifier.align(Alignment.Start), fontSize = 13.sp)
                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("100", "500", "1000").forEach { preset ->
                        OutlinedButton(
                            onClick = { selectedPreset = preset; amount = preset },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (selectedPreset == preset) Color(0xFFF59E0B).copy(0.2f) else Color.Transparent
                            ),
                            border = BorderStroke(1.5.dp, if (selectedPreset == preset) Color(0xFFF59E0B) else Color.DarkGray),
                            shape = RoundedCornerShape(10.dp)
                        ) { Text("₹$preset", color = if (selectedPreset == preset) Color(0xFFF59E0B) else Color.White, fontSize = 13.sp) }
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it; selectedPreset = "" },
                    label = { Text("Custom Amount (₹)", color = Color.Gray) },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFF59E0B)
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancel", color = Color.Gray)
                    }
                    Button(
                        onClick = {
                            val amt = amount.toDoubleOrNull()
                            if (amt != null && amt >= 1) onPay(amt)
                        },
                        enabled = (amount.toDoubleOrNull() ?: 0.0) >= 1.0,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text("Pay ₹$amount", fontWeight = FontWeight.Bold) }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                    Text("🔒 256-bit SSL encrypted • Powered by Razorpay", color = Color.Gray, fontSize = 11.sp)
                }
            }
        }
    }
}
