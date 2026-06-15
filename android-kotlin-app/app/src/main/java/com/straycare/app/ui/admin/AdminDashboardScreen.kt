package com.straycare.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.*
import com.straycare.app.data.network.ApiClient
import com.straycare.app.ui.ngo.BarChartCard
import com.straycare.app.ui.ngo.EmptyState
import kotlinx.coroutines.launch
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.platform.LocalContext
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import android.preference.PreferenceManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onNavigateToCaseDetail: (Int) -> Unit = {},
    onLogout: () -> Unit = {}
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("🏠 Overview", "🚑 Dispatch", "📦 Orders", "🗺️ Hotspots")
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            Column {
                Box(
                    modifier = Modifier.fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D0D1F))))
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(46.dp).clip(CircleShape)
                                .background(Brush.linearGradient(listOf(Color(0xFFEC4899), Color(0xFF8B5CF6)))),
                            contentAlignment = Alignment.Center
                        ) { Text("🛡️", fontSize = 22.sp) }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Admin Control Centre", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold)
                            Text("Platform-wide management & smart dispatch", color = Color(0xFFEC4899), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }
                        IconButton(onClick = { showLogoutDialog = true }) {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.15f)),
                                shape = RoundedCornerShape(10.dp)
                            ) { Text("⏻", fontSize = 18.sp, modifier = Modifier.padding(8.dp)) }
                        }
                    }
                }
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color(0xFF1A1A2E),
                    contentColor = Color.White,
                    indicator = { tp ->
                        TabRowDefaults.SecondaryIndicator(modifier = Modifier.tabIndicatorOffset(tp[selectedTab]), color = Color(0xFFEC4899))
                    }
                ) {
                    tabs.forEachIndexed { i, title ->
                        Tab(selected = selectedTab == i, onClick = { selectedTab = i }) {
                            Text(title, Modifier.padding(vertical = 12.dp), fontSize = 12.sp,
                                color = if (selectedTab == i) Color(0xFFEC4899) else Color.Gray,
                                fontWeight = if (selectedTab == i) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                0 -> AdminOverviewTab()
                1 -> SmartDispatchTab(onNavigateToCaseDetail = onNavigateToCaseDetail)
                2 -> AdminFoodOrdersTab()
                3 -> HotspotMapTab()
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = Color(0xFF1A1A2E),
            title = { Text("Log Out", color = Color.White, fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to log out of the Admin portal?", color = Color(0xFF94A3B8)) },
            confirmButton = {
                Button(
                    onClick = { com.straycare.app.data.network.TokenManager.clearAll(); onLogout() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                    shape = RoundedCornerShape(10.dp)
                ) { Text("Log Out", fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel", color = Color.Gray) }
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: OVERVIEW — Stats + NGO Verification
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun AdminOverviewTab() {
    val coroutineScope = rememberCoroutineScope()
    var caseStats by remember { mutableStateOf<AdminCaseStats?>(null) }
    var donationStats by remember { mutableStateOf<AdminDonationStats?>(null) }
    var adoptionStats by remember { mutableStateOf<AdminAdoptionStats?>(null) }
    var pendingNgos by remember { mutableStateOf<List<NgoProfile>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    val fetchData = {
        coroutineScope.launch {
            isLoading = true
            try {
                val c = ApiClient.apiService.getAdminCaseStats()
                val d = ApiClient.apiService.getAdminDonationStats()
                val a = ApiClient.apiService.getAdminAdoptionStats()
                val p = ApiClient.apiService.getPendingNgos()
                if (c.isSuccessful) caseStats = c.body()
                if (d.isSuccessful) donationStats = d.body()
                if (a.isSuccessful) adoptionStats = a.body()
                if (p.isSuccessful) pendingNgos = p.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }
    LaunchedEffect(Unit) { fetchData() }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFEC4899)) }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {

            // KPI Cards
            item {
                Text("Platform Overview", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AdminKpi("📋", "${caseStats?.total ?: 0}", "Total Cases", Color(0xFFA5B4FC), Modifier.weight(1f))
                    AdminKpi("🚨", "${caseStats?.pending ?: 0}", "Pending", Color(0xFFEF4444), Modifier.weight(1f))
                    AdminKpi("✅", "${caseStats?.resolved ?: 0}", "Resolved", Color(0xFF22C55E), Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AdminKpi("💰", "₹${donationStats?.total_amount?.toLong() ?: 0}", "Donations", Color(0xFFFBBF24), Modifier.weight(1f))
                    AdminKpi("🐾", "${adoptionStats?.total_adopted ?: 0}", "Adopted", Color(0xFFF9A8D4), Modifier.weight(1f))
                    AdminKpi("🏠", "${adoptionStats?.available_pets ?: 0}", "Available", Color(0xFF60A5FA), Modifier.weight(1f))
                }
            }

            // Cases chart
            caseStats?.monthwise?.let { monthwise ->
                if (monthwise.isNotEmpty()) {
                    item { BarChartCard("Cases per Month", monthwise.map { it.label to it.count.toFloat() }, Color(0xFF6366F1)) }
                }
            }

            // Donations chart
            donationStats?.monthwise?.let { monthwise ->
                if (monthwise.isNotEmpty()) {
                    item { BarChartCard("Donations (₹) per Month", monthwise.map { it.label to it.amount.toFloat() }, Color(0xFFF59E0B)) }
                }
            }

            // NGO Verification
            item {
                Spacer(Modifier.height(4.dp))
                Text("Pending NGO Verifications", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${pendingNgos.size} NGO(s) awaiting approval", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp))
            }

            if (pendingNgos.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                            Text("✅  All NGO verifications are up to date!", color = Color(0xFF22C55E), modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                        }
                    }
                }
            } else {
                items(pendingNgos) { ngo ->
                    PendingNgoCard(ngo,
                        onVerify = {
                            coroutineScope.launch {
                                try { ApiClient.apiService.verifyNgo(ngo.id); fetchData() } catch (_: Exception) {}
                            }
                        },
                        onReject = {
                            coroutineScope.launch {
                                try { ApiClient.apiService.deleteNgo(ngo.id, mapOf("reason" to "Rejected by admin")); fetchData() } catch (_: Exception) {}
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun AdminKpi(icon: String, value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(
                Modifier.size(36.dp).clip(RoundedCornerShape(10.dp))
                    .background(color.copy(0.15f)),
                contentAlignment = Alignment.Center
            ) { Text(icon, fontSize = 18.sp) }
            Spacer(Modifier.height(8.dp))
            Text(value, color = color, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
            Text(label, color = Color(0xFF8B8BA7), fontSize = 10.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun PendingNgoCard(ngo: NgoProfile, onVerify: () -> Unit, onReject: () -> Unit = {}) {
    var showRejectDialog by remember { mutableStateOf(false) }
    var rejectReason by remember { mutableStateOf("") }

    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(46.dp).clip(CircleShape).background(Color(0xFFEC4899).copy(0.15f)), contentAlignment = Alignment.Center) {
                    Text("🏥", fontSize = 24.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(ngo.name ?: ngo.ngo_name ?: "Unknown NGO", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    if (!ngo.email.isNullOrBlank()) {
                        Text("✉️ ${ngo.email}", color = Color.Gray, fontSize = 11.sp)
                    }
                    if (!ngo.location.isNullOrBlank()) {
                        Text("📍 ${ngo.location}", color = Color.Gray, fontSize = 11.sp)
                    }
                }
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF59E0B).copy(0.15f)), shape = RoundedCornerShape(8.dp)) {
                    Text("⏳ Pending", color = Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }
            if (!ngo.description.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(ngo.description, color = Color(0xFF94A3B8), fontSize = 12.sp, maxLines = 2, lineHeight = 18.sp)
            }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = { showRejectDialog = true },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444))
                ) { Text("✕ Reject", fontWeight = FontWeight.Bold) }
                Button(
                    onClick = onVerify,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                    shape = RoundedCornerShape(10.dp)
                ) { Text("✓ Approve", fontWeight = FontWeight.Bold) }
            }
        }
    }

    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            containerColor = Color(0xFF1A1A2E),
            title = { Text("Reject NGO Application", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Rejecting: ${ngo.name ?: ngo.ngo_name}", color = Color(0xFF94A3B8), fontSize = 13.sp, modifier = Modifier.padding(bottom = 12.dp))
                    OutlinedTextField(
                        value = rejectReason, onValueChange = { rejectReason = it },
                        label = { Text("Reason for rejection", color = Color.Gray) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFFEF4444), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showRejectDialog = false; onReject() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                    shape = RoundedCornerShape(10.dp)
                ) { Text("Reject", fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) { Text("Cancel", color = Color.Gray) }
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: SMART DISPATCH
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SmartDispatchTab(onNavigateToCaseDetail: (Int) -> Unit = {}) {
    val coroutineScope = rememberCoroutineScope()
    var unassignedCases by remember { mutableStateOf<List<Case>>(emptyList()) }
    var selectedCase by remember { mutableStateOf<Case?>(null) }
    var recommendations by remember { mutableStateOf<List<DispatchRecommendation>>(emptyList()) }
    var isLoadingCases by remember { mutableStateOf(true) }
    var isLoadingRecs by remember { mutableStateOf(false) }
    var assigningNgoId by remember { mutableStateOf<Int?>(null) }

    val fetchCases = {
        coroutineScope.launch {
            isLoadingCases = true
            try {
                val res = ApiClient.apiService.getUnassignedCases()
                if (res.isSuccessful) unassignedCases = res.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoadingCases = false }
        }
    }

    LaunchedEffect(Unit) { fetchCases() }

    if (isLoadingCases) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFEC4899)) }
    } else if (selectedCase == null) {
        // Show case list
        if (unassignedCases.isEmpty()) {
            EmptyState("🎉", "No unassigned cases!\nAll cases are dispatched.")
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Text("Smart Dispatch", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("${unassignedCases.size} unassigned case(s). Tap a case to see AI-ranked NGO recommendations.", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 8.dp))
                }
                items(unassignedCases) { case ->
                    DispatchCaseCard(case, onClick = {
                        selectedCase = case
                        isLoadingRecs = true
                        coroutineScope.launch {
                            try {
                                val res = ApiClient.apiService.getDispatchRecommendations(case.id)
                                if (res.isSuccessful) recommendations = res.body() ?: emptyList()
                            } catch (_: Exception) {} finally { isLoadingRecs = false }
                        }
                    }, onLongClick = { onNavigateToCaseDetail(case.id) })
                }
            }
        }
    } else {
        // Show NGO recommendations for selected case
        val case = selectedCase!!
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { selectedCase = null; recommendations = emptyList() }) {
                        Text("← Back", color = Color(0xFFEC4899))
                    }
                    Spacer(Modifier.width(8.dp))
                    Text("Case #${case.id} — Dispatch", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                Spacer(Modifier.height(4.dp))
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        val sevColor = when (case.severity_label) {
                            "Critical" -> Color(0xFFEF4444); "High" -> Color(0xFFF97316); else -> Color(0xFFEAB308)
                        }
                        Text("${case.severity_label ?: "Unknown"} Severity", color = sevColor, fontWeight = FontWeight.Bold)
                        Text(case.description ?: "No description.", color = Color.LightGray, fontSize = 13.sp)
                        val context = LocalContext.current
                        Row(
                            modifier = Modifier.clickable {
                                val uri = android.net.Uri.parse("geo:${case.latitude},${case.longitude}?q=${case.latitude},${case.longitude}(Stray+Animal+Case)")
                                context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, uri))
                            }.padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("📍", fontSize = 14.sp)
                            Spacer(Modifier.width(6.dp))
                            Text("${case.latitude}, ${case.longitude}", color = Color(0xFF3B82F6), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
            item {
                Text("🤖 AI-Ranked NGO Recommendations", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("Ranked by proximity + availability score", color = Color.Gray, fontSize = 12.sp)
            }
            if (isLoadingRecs) {
                item { Box(Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFEC4899)) } }
            } else if (recommendations.isEmpty()) {
                item { Text("No NGOs available for this area.", color = Color.Gray, modifier = Modifier.padding(vertical = 20.dp)) }
            } else {
                items(recommendations.take(5)) { rec ->
                    val rank = recommendations.indexOf(rec)
                    NgoRecommendationCard(
                        rec = rec, rank = rank, isAssigning = assigningNgoId == rec.ngo_id,
                        onAssign = {
                            assigningNgoId = rec.ngo_id
                            coroutineScope.launch {
                                try {
                                    val res = ApiClient.apiService.assignCase(case.id, rec.ngo_id)
                                    if (res.isSuccessful) {
                                        selectedCase = null
                                        recommendations = emptyList()
                                        fetchCases()
                                    }
                                } catch (_: Exception) {} finally { assigningNgoId = null }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun DispatchCaseCard(case: Case, onClick: () -> Unit, onLongClick: () -> Unit = {}) {
    val sevColor = when (case.severity_label) {
        "Critical" -> Color(0xFFEF4444); "High" -> Color(0xFFF97316); "Moderate" -> Color(0xFFEAB308); else -> Color(0xFF22C55E)
    }
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).clip(CircleShape).background(sevColor.copy(0.15f)), contentAlignment = Alignment.Center) {
                Text("🚨", fontSize = 22.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Case #${case.id}", color = Color.White, fontWeight = FontWeight.Bold)
                    Text(case.severity_label ?: "Unknown", color = sevColor, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Text(case.description?.take(60) ?: "No description.", color = Color.Gray, fontSize = 12.sp)
                val context = LocalContext.current
                Row(
                    modifier = Modifier.clickable {
                        val uri = android.net.Uri.parse("geo:${case.latitude},${case.longitude}?q=${case.latitude},${case.longitude}(Stray+Animal+Case)")
                        context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, uri))
                    }.padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("📍", fontSize = 12.sp)
                    Spacer(Modifier.width(4.dp))
                    Text("${case.latitude}, ${case.longitude}", color = Color(0xFF3B82F6), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                }
            }
            Spacer(Modifier.width(8.dp))
            Text("›", color = Color(0xFFEC4899), fontSize = 24.sp)
        }
    }
}

@Composable
fun NgoRecommendationCard(rec: DispatchRecommendation, rank: Int, isAssigning: Boolean, onAssign: () -> Unit) {
    val rankEmoji = listOf("🥇", "🥈", "🥉", "4️⃣", "5️⃣")
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(rankEmoji.getOrElse(rank) { "${rank + 1}." }, fontSize = 20.sp)
                    Spacer(Modifier.width(8.dp))
                    Text(rec.ngo_name ?: "NGO", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF6366F1).copy(0.2f)), shape = RoundedCornerShape(20.dp)) {
                    Text("${rec.total_score.toInt()} pts", color = Color(0xFFA5B4FC), fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }
            Spacer(Modifier.height(10.dp))
            // Score bars
            ScoreBar("📍 Proximity", rec.proximity_score, 50.0, Color(0xFF6366F1))
            Spacer(Modifier.height(4.dp))
            ScoreBar("📋 Availability", rec.caseload_score, 30.0, Color(0xFF22C55E))
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("📏 ${rec.distance_km} km away", color = Color.Gray, fontSize = 12.sp)
                Text("📂 ${rec.active_cases} active cases", color = Color.Gray, fontSize = 12.sp)
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onAssign, enabled = !isAssigning,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899)),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (isAssigning) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("🚑 Dispatch to this NGO", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ScoreBar(label: String, value: Double, max: Double, color: Color) {
    val pct = (value / max).coerceIn(0.0, 1.0).toFloat()
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = Color.Gray, fontSize = 11.sp)
            Text("${value.toInt()} / ${max.toInt()}", color = Color.Gray, fontSize = 11.sp)
        }
        Spacer(Modifier.height(3.dp))
        Box(Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(Color.White.copy(0.08f))) {
            Box(Modifier.fillMaxWidth(pct).height(6.dp).clip(CircleShape).background(color))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: FOOD ORDERS (Admin View)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun AdminFoodOrdersTab() {
    val coroutineScope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<AdminFoodOrder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var updatingId by remember { mutableStateOf<Int?>(null) }

    val fetchOrders = {
        coroutineScope.launch {
            isLoading = true
            try {
                val res = ApiClient.apiService.getAdminFoodOrders()
                if (res.isSuccessful) orders = res.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }
    LaunchedEffect(Unit) { fetchOrders() }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFEC4899)) }
    } else if (orders.isEmpty()) {
        EmptyState("📦", "No food orders found")
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text("Food Orders", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${orders.size} orders • Tap to update status", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            }
            items(orders) { order ->
                AdminOrderCard(order, isUpdating = updatingId == order.id, onStatusChange = { newStatus ->
                    updatingId = order.id
                    coroutineScope.launch {
                        try {
                            ApiClient.apiService.updateFoodOrderStatus(order.id, StatusUpdateRequest(newStatus))
                            fetchOrders()
                        } catch (_: Exception) {} finally { updatingId = null }
                    }
                })
            }
        }
    }
}

@Composable
fun AdminOrderCard(order: AdminFoodOrder, isUpdating: Boolean, onStatusChange: (String) -> Unit) {
    val (statusColor, statusIcon) = when (order.status) {
        "Confirmed" -> Color(0xFF22C55E) to "✅"
        "Delivered" -> Color(0xFF6366F1) to "🎉"
        "Cancelled" -> Color(0xFFEF4444) to "❌"
        else -> Color(0xFFF59E0B) to "⏳"
    }
    var expanded by remember { mutableStateOf(false) }

    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth().clickable { expanded = !expanded }, verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("🛍️ ${order.product_name ?: "Unknown Item"}", color = Color.White, fontWeight = FontWeight.Bold)
                    Text("Qty: ${order.quantity} • ₹${String.format("%.0f", order.total_price)}", color = Color.Gray, fontSize = 12.sp)
                    if (!order.user_name.isNullOrBlank()) Text("👤 ${order.user_name}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                }
                Card(colors = CardDefaults.cardColors(containerColor = statusColor.copy(0.15f)), shape = RoundedCornerShape(20.dp)) {
                    Text("$statusIcon ${order.status ?: "Pending"}", color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }

            if (expanded) {
                Spacer(Modifier.height(12.dp))
                if (!order.delivery_address.isNullOrBlank()) {
                    Text("📍 ${order.delivery_address}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
                if (!order.ordered_at.isNullOrBlank()) {
                    Text(order.ordered_at.take(16).replace("T", " "), color = Color.Gray, fontSize = 11.sp)
                }
                Spacer(Modifier.height(12.dp))
                if (isUpdating) {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(24.dp), color = Color(0xFFEC4899), strokeWidth = 2.dp) }
                } else {
                    Text("Update Status:", color = Color.LightGray, fontSize = 13.sp, modifier = Modifier.padding(bottom = 8.dp))
                    val statuses = listOf("Pending", "Confirmed", "Delivered", "Cancelled")
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        statuses.forEach { status ->
                            if (status != order.status) {
                                val btnColor = when (status) {
                                    "Confirmed" -> Color(0xFF22C55E); "Delivered" -> Color(0xFF6366F1); "Cancelled" -> Color(0xFFEF4444); else -> Color(0xFFF59E0B)
                                }
                                OutlinedButton(
                                    onClick = { onStatusChange(status) },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.outlinedButtonColors(),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                                ) { Text(status, color = btnColor, fontSize = 11.sp) }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: HOTSPOT MAP (OSMDroid K-Means Clusters)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun HotspotMapTab() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var hotspotData by remember { mutableStateOf<HotspotResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        Configuration.getInstance().load(context, PreferenceManager.getDefaultSharedPreferences(context))
        Configuration.getInstance().userAgentValue = context.packageName
        isLoading = true
        try {
            val res = ApiClient.apiService.getAdminHotspots()
            if (res.isSuccessful) {
                hotspotData = res.body()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoading = false
        }
    }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFFEC4899))
        }
    } else if (hotspotData == null) {
        EmptyState("🗺️", "Failed to load hotspot data.")
    } else {
        Box(Modifier.fillMaxSize()) {
            AndroidView(
                factory = { ctx ->
                    MapView(ctx).apply {
                        setTileSource(TileSourceFactory.MAPNIK)
                        setMultiTouchControls(true)
                        controller.setZoom(11.0)
                        
                        // Center map on the first cluster or a default location
                        val centerPoint = hotspotData?.clusters?.firstOrNull()?.let { GeoPoint(it.center_lat, it.center_lon) } 
                            ?: GeoPoint(19.0760, 72.8777) // Mumbai default
                        controller.setCenter(centerPoint)

                        // 1. Draw Clusters (Danger Zones)
                        hotspotData?.clusters?.forEach { cluster ->
                            val circle = Polygon().apply {
                                points = Polygon.pointsAsCircle(GeoPoint(cluster.center_lat, cluster.center_lon), cluster.radius_km * 1000.0)
                                fillColor = android.graphics.Color.argb(40, 239, 68, 68) // 15% opacity red
                                strokeColor = android.graphics.Color.argb(200, 239, 68, 68) // Solid red border
                                strokeWidth = 3f
                                title = "Zone ${cluster.cluster_id} (${cluster.case_count} cases)"
                            }
                            overlays.add(circle)
                            
                            // Add a hidden marker to show cluster info bubble
                            val clusterMarker = Marker(this).apply {
                                position = GeoPoint(cluster.center_lat, cluster.center_lon)
                                title = "⚠️ Danger Zone"
                                snippet = "${cluster.case_count} stray cases in a ${String.format("%.1f", cluster.radius_km)}km radius"
                                icon = context.getDrawable(android.R.drawable.ic_dialog_alert) // Built-in alert icon
                            }
                            overlays.add(clusterMarker)
                        }

                        // 2. Draw Individual Case Markers
                        hotspotData?.markers?.forEach { m ->
                            val marker = Marker(this).apply {
                                position = GeoPoint(m.lat, m.lon)
                                title = "Case #${m.id} (${m.severity_label})"
                                snippet = "${m.status}\n${m.description}"
                                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            }
                            overlays.add(marker)
                        }
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Overlay Top Stats
            Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.TopCenter) {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E).copy(0.9f)), shape = RoundedCornerShape(12.dp)) {
                    Row(Modifier.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("🚨", fontSize = 20.sp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Zone Red: Live Map", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("${hotspotData?.total_cases_mapped ?: 0} active cases across ${hotspotData?.clusters?.size ?: 0} danger zones", color = Color(0xFFEC4899), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}
