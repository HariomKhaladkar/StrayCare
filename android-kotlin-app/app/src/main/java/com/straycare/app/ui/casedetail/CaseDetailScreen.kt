package com.straycare.app.ui.casedetail

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.Case
import com.straycare.app.data.models.CaseUpdate
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(caseId: Int, onBack: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    val role = TokenManager.getUserRole()

    var case by remember { mutableStateOf<Case?>(null) }
    var updates by remember { mutableStateOf<List<CaseUpdate>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showUpdateDialog by remember { mutableStateOf(false) }
    var updatePosted by remember { mutableStateOf(false) }

    val refresh = {
        coroutineScope.launch {
            isLoading = true
            try {
                val cRes = ApiClient.apiService.getCaseDetail(caseId)
                val uRes = ApiClient.apiService.getCaseUpdates(caseId)
                if (cRes.isSuccessful) case = cRes.body()
                if (uRes.isSuccessful) updates = uRes.body() ?: emptyList()
            } catch (_: Exception) {}
            finally { isLoading = false }
        }
    }

    LaunchedEffect(Unit) { refresh() }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            TopAppBar(
                title = { Text("Case #$caseId", color = Color.White, fontWeight = FontWeight.ExtraBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F0F1A))
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else {
            val c = case
            if (c == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Case not found.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(bottom = 32.dp)
                ) {
                    // ── Hero Image ──────────────────────────────────
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(260.dp)) {
                            if (!c.photo_url.isNullOrBlank()) {
                                AsyncImage(
                                    model = "${ApiClient.BASE_URL}${c.photo_url}",
                                    contentDescription = "Case Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(Modifier.fillMaxSize().background(Color(0xFF1A1A2E)), contentAlignment = Alignment.Center) {
                                    Text("🐾", fontSize = 64.sp)
                                }
                            }
                            // Gradient overlay at bottom
                            Box(
                                Modifier.fillMaxSize().background(
                                    Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF0F0F1A)), startY = 100f)
                                )
                            )
                            // Severity chip
                            val sevColor = when (c.severity_label) {
                                "Critical" -> Color(0xFFEF4444); "High" -> Color(0xFFF97316)
                                "Moderate" -> Color(0xFFEAB308); else -> Color(0xFF22C55E)
                            }
                            val sevEmoji = when (c.severity_label) {
                                "Critical" -> "🔴"; "High" -> "🟠"; "Moderate" -> "🟡"; else -> "🟢"
                            }
                            Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.BottomStart) {
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Card(colors = CardDefaults.cardColors(containerColor = sevColor.copy(0.9f)), shape = RoundedCornerShape(20.dp)) {
                                        Text("$sevEmoji ${c.severity_label ?: "Unknown"}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                                    }
                                    val statusColor = when (c.status) {
                                        "Resolved" -> Color(0xFF22C55E); "Accepted" -> Color(0xFF3B82F6); "Rejected" -> Color(0xFFEF4444); else -> Color(0xFFF59E0B)
                                    }
                                    Card(colors = CardDefaults.cardColors(containerColor = statusColor.copy(0.9f)), shape = RoundedCornerShape(20.dp)) {
                                        Text(c.status ?: "Pending", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                                    }
                                }
                            }
                        }
                    }

                    // ── Main Info Card ──────────────────────────────
                    item {
                        Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Case #${c.id}", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                                Text(c.created_at?.take(10) ?: "", color = Color.Gray, fontSize = 12.sp)
                            }
                            Spacer(Modifier.height(10.dp))
                            Text(c.description ?: "No description provided.", color = Color(0xFFCCCCDD), fontSize = 15.sp, lineHeight = 22.sp)
                        }
                    }

                    // ── Location Card ────────────────────────────────
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                                .clickable {
                                    val uri = Uri.parse("geo:${c.latitude},${c.longitude}?q=${c.latitude},${c.longitude}(Case+%23${c.id})")
                                    context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                },
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(42.dp).clip(CircleShape).background(Color(0xFF3B82F6).copy(0.15f)), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(22.dp))
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text("Location", color = Color.White, fontWeight = FontWeight.Bold)
                                    Text("${c.latitude}, ${c.longitude}", color = Color(0xFF94A3B8), fontSize = 13.sp)
                                }
                                Text("Open Maps →", color = Color(0xFF3B82F6), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }

                    // ── NGO Action Button (role-aware) ───────────────
                    if (role.lowercase() == "ngo" && c.status == "Accepted") {
                        item {
                            Spacer(Modifier.height(8.dp))
                            Button(
                                onClick = { showUpdateDialog = true },
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(vertical = 14.dp)
                            ) {
                                Text("📝  Post Progress Update", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }

                    if (updatePosted) {
                        item {
                            Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(0.1f)), shape = RoundedCornerShape(12.dp)) {
                                Text("✅ Update posted successfully!", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold, modifier = Modifier.padding(14.dp))
                            }
                        }
                    }

                    // ── Case Timeline ─────────────────────────────────
                    item {
                        Spacer(Modifier.height(16.dp))
                        Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("📋  Case Timeline", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                            Text("${updates.size} update${if (updates.size != 1) "s" else ""}", color = Color.Gray, fontSize = 13.sp)
                        }
                        Spacer(Modifier.height(10.dp))
                    }

                    // Case reported event
                    item {
                        TimelineEvent(
                            icon = "🚨",
                            iconBg = Color(0xFFEF4444).copy(0.15f),
                            iconColor = Color(0xFFEF4444),
                            title = "Case Reported",
                            subtitle = c.created_at?.take(16)?.replace("T", " ") ?: "",
                            isFirst = true,
                            isLast = updates.isEmpty() && c.status == "Pending"
                        )
                    }

                    if (c.status != "Pending") {
                        item {
                            val (icon, color, text) = when (c.status) {
                                "Accepted" -> Triple("✅", Color(0xFF22C55E), "NGO Accepted — Rescue Underway")
                                "Rejected" -> Triple("❌", Color(0xFFEF4444), "Case Rejected by NGO")
                                "Resolved" -> Triple("🎉", Color(0xFF6366F1), "Case Successfully Resolved")
                                else -> Triple("⏳", Color(0xFFF59E0B), c.status ?: "")
                            }
                            TimelineEvent(icon = icon, iconBg = color.copy(0.15f), iconColor = color, title = text, subtitle = "", isFirst = false, isLast = updates.isEmpty())
                        }
                    }

                    if (updates.isEmpty() && (c.status == "Pending" || c.status == "Rejected")) {
                        item {
                            Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                Text("No updates posted yet.", color = Color.Gray, fontSize = 13.sp, textAlign = TextAlign.Center)
                            }
                        }
                    } else {
                        items(updates.size) { idx ->
                            val upd = updates[idx]
                            TimelineEvent(
                                icon = "📋",
                                iconBg = Color(0xFF8B5CF6).copy(0.15f),
                                iconColor = Color(0xFF8B5CF6),
                                title = upd.notes,
                                subtitle = upd.created_at?.take(16)?.replace("T", " ") ?: "",
                                photoUrl = upd.photo_url,
                                isFirst = false,
                                isLast = idx == updates.size - 1
                            )
                        }
                    }

                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }

    if (showUpdateDialog) {
        PostUpdateDialogFull(
            caseId = caseId,
            onDismiss = { showUpdateDialog = false },
            onPosted = {
                showUpdateDialog = false
                updatePosted = true
                refresh()
            }
        )
    }
}

@Composable
fun TimelineEvent(
    icon: String, iconBg: Color, iconColor: Color,
    title: String, subtitle: String, photoUrl: String? = null,
    isFirst: Boolean, isLast: Boolean
) {
    Row(Modifier.padding(horizontal = 16.dp)) {
        // Timeline line + dot
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(40.dp)) {
            if (!isFirst) {
                Box(Modifier.width(2.dp).height(12.dp).background(Color(0xFF2A2A3E)))
            } else Spacer(Modifier.height(12.dp))
            Box(Modifier.size(36.dp).clip(CircleShape).background(iconBg), contentAlignment = Alignment.Center) {
                Text(icon, fontSize = 16.sp)
            }
            if (!isLast) {
                Box(Modifier.width(2.dp).height(if (photoUrl != null) 160.dp else 12.dp).background(Color(0xFF2A2A3E)))
            }
        }

        Spacer(Modifier.width(12.dp))

        // Content
        Column(Modifier.weight(1f).padding(top = 6.dp, bottom = 16.dp)) {
            Text(title, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium, lineHeight = 20.sp)
            if (subtitle.isNotBlank()) {
                Text(subtitle, color = Color.Gray, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
            }
            if (!photoUrl.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                AsyncImage(
                    model = "${ApiClient.BASE_URL}$photoUrl",
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF2A2A3E))
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostUpdateDialogFull(caseId: Int, onDismiss: () -> Unit, onPosted: () -> Unit) {
    var notes by remember { mutableStateOf("") }
    var isPosting by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isPosting) onDismiss() }) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(24.dp)) {
            Column(Modifier.padding(24.dp)) {
                Text("📝 Post Progress Update", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                Text("Case #$caseId", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp, bottom = 16.dp))

                OutlinedTextField(
                    value = notes, onValueChange = { notes = it },
                    label = { Text("Describe the progress...", color = Color.Gray) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                    modifier = Modifier.fillMaxWidth().height(130.dp), shape = RoundedCornerShape(14.dp), maxLines = 6
                )
                Spacer(Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel", color = Color.Gray) }
                    Button(
                        onClick = {
                            if (notes.isNotBlank()) {
                                isPosting = true
                                coroutineScope.launch {
                                    try {
                                        val body = notes.toRequestBody("text/plain".toMediaType())
                                        val res = ApiClient.apiService.postCaseUpdate(caseId, body, null)
                                        if (res.isSuccessful) onPosted()
                                    } catch (_: Exception) {} finally { isPosting = false }
                                }
                            }
                        },
                        enabled = !isPosting && notes.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                        modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                    ) {
                        if (isPosting) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        else Text("Post Update", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
