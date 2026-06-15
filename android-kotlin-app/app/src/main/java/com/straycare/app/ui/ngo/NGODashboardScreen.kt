package com.straycare.app.ui.ngo

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import okhttp3.MultipartBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.straycare.app.data.models.*
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NGODashboardScreen(
    onNavigateToProfile: () -> Unit = {},
    onNavigateToCaseDetail: (Int) -> Unit = {},
    onLogout: () -> Unit = {}
) {
    val ngoName = TokenManager.getUserName()
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("🚨 Rescues", "🐾 Adoptions", "📖 Stories", "📊 Analytics", "🔔 Alerts")
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            Column {
                // ── Premium NGO Header ─────────────────────────────
                Box(
                    modifier = Modifier.fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(Color(0xFF1A1040), Color(0xFF0D0D1F))))
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        // Avatar
                        Box(
                            Modifier.size(46.dp).clip(CircleShape)
                                .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(ngoName.firstOrNull()?.uppercaseChar()?.toString() ?: "N", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("🏥 $ngoName", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold)
                            Text("NGO Partner Dashboard", color = Color(0xFF8B5CF6), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        }
                        // Logout button
                        IconButton(onClick = { showLogoutDialog = true }) {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.15f)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("⏻", fontSize = 18.sp, modifier = Modifier.padding(8.dp))
                            }
                        }
                    }
                }
                // ── Tabs ───────────────────────────────────────────
                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color(0xFF1A1A2E),
                    contentColor = Color.White,
                    edgePadding = 8.dp,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]), color = Color(0xFF8B5CF6))
                    }
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(selected = selectedTab == index, onClick = { selectedTab = index }) {
                            Text(title, modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp), fontSize = 12.sp,
                                color = if (selectedTab == index) Color(0xFF8B5CF6) else Color.Gray,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                0 -> RescuesTab(onNavigateToCaseDetail = onNavigateToCaseDetail)
                1 -> AdoptionsTab()
                2 -> NgoStoriesTab()
                3 -> NgoAnalyticsTab()
                4 -> NotificationsTab()
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = Color(0xFF1A1A2E),
            title = { Text("Log Out", color = Color.White, fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to log out of the NGO portal?", color = Color(0xFF94A3B8)) },
            confirmButton = {
                Button(
                    onClick = { TokenManager.clearAll(); onLogout() },
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
// TAB 1: RESCUES
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun RescuesTab(onNavigateToCaseDetail: (Int) -> Unit = {}) {
    val coroutineScope = rememberCoroutineScope()
    var cases by remember { mutableStateOf<List<Case>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showUpdateDialog by remember { mutableStateOf<Case?>(null) }

    val fetchCases = {
        coroutineScope.launch {
            isLoading = true
            try {
                val res = ApiClient.apiService.getNgoCases()
                if (res.isSuccessful) cases = res.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }
    LaunchedEffect(Unit) { fetchCases() }

    val pending = cases.filter { it.status == "Pending" }
    val active = cases.filter { it.status == "Accepted" }
    val resolved = cases.filter { it.status == "Resolved" }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatChip("🚨", "${pending.size}", "Pending", Color(0xFFEF4444), Modifier.weight(1f))
                    StatChip("🏥", "${active.size}", "Active", Color(0xFF22C55E), Modifier.weight(1f))
                    StatChip("✅", "${resolved.size}", "Resolved", Color(0xFF6366F1), Modifier.weight(1f))
                }
            }
            if (pending.isNotEmpty()) {
                item { SectionHeader("🚨 Urgent Pending Rescues") }
                items(pending) { case ->
                    NgoFullCaseCard(case, isPending = true,
                        onAccept = { coroutineScope.launch { ApiClient.apiService.acceptCase(case.id); fetchCases() } },
                        onReject = { coroutineScope.launch { ApiClient.apiService.rejectCase(case.id); fetchCases() } },
                        onUpdate = null,
                        onTap = { onNavigateToCaseDetail(case.id) }
                    )
                }
            }
            if (active.isNotEmpty()) {
                item { SectionHeader("🏥 Your Active Cases") }
                items(active) { case ->
                    NgoFullCaseCard(case, isPending = false,
                        onAccept = {}, onReject = {},
                        onUpdate = { showUpdateDialog = case },
                        onTap = { onNavigateToCaseDetail(case.id) }
                    )
                }
            }
            if (pending.isEmpty() && active.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(top = 60.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🎉", fontSize = 48.sp)
                            Spacer(Modifier.height(12.dp))
                            Text("All caught up!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("No pending or active rescues.", color = Color.Gray)
                        }
                    }
                }
            }
        }
    }

    showUpdateDialog?.let { case ->
        PostUpdateDialog(case = case, onDismiss = { showUpdateDialog = null }, onPosted = { showUpdateDialog = null; fetchCases() })
    }
}

@Composable
fun NgoFullCaseCard(case: Case, isPending: Boolean, onAccept: () -> Unit, onReject: () -> Unit, onUpdate: (() -> Unit)?, onTap: () -> Unit = {}) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onTap), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
        Column {
            if (!case.photo_url.isNullOrBlank()) {
                AsyncImage(
                    model = "${ApiClient.BASE_URL}${case.photo_url}",
                    contentDescription = null, contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(160.dp).clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)).background(Color(0xFF2A2A3E))
                )
            }
            Column(Modifier.padding(14.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    val sevColor = when (case.severity_label) {
                        "Critical" -> Color(0xFFEF4444); "High" -> Color(0xFFF97316); "Moderate" -> Color(0xFFEAB308); else -> Color(0xFF22C55E)
                    }
                    Card(colors = CardDefaults.cardColors(containerColor = sevColor.copy(0.15f)), shape = RoundedCornerShape(8.dp)) {
                        Text("${case.severity_label ?: "Unknown"} (${case.severity_score ?: 0}/10)", color = sevColor, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                    }
                    Text(case.created_at?.take(10) ?: "", color = Color.Gray, fontSize = 11.sp)
                }
                Spacer(Modifier.height(8.dp))
                Text(case.description ?: "No description.", color = Color.White, fontSize = 14.sp)
                Spacer(Modifier.height(6.dp))
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
                Spacer(Modifier.height(12.dp))

                if (isPending) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(onClick = onReject, modifier = Modifier.weight(1f), colors = ButtonDefaults.outlinedButtonColors(), shape = RoundedCornerShape(10.dp)) {
                            Text("✗ Reject", color = Color(0xFFEF4444))
                        }
                        Button(onClick = onAccept, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)), shape = RoundedCornerShape(10.dp)) {
                            Text("✓ Accept")
                        }
                    }
                } else if (onUpdate != null) {
                    Button(onClick = onUpdate, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)), shape = RoundedCornerShape(10.dp)) {
                        Text("📝 Post Update")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostUpdateDialog(case: Case, onDismiss: () -> Unit, onPosted: () -> Unit) {
    var notes by remember { mutableStateOf("") }
    var isPosting by remember { mutableStateOf(false) }
    var isSuccess by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isPosting) onDismiss() }) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(20.dp)) {
            Column(Modifier.padding(24.dp)) {
                if (isSuccess) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("✅", fontSize = 48.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("Update Posted!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Spacer(Modifier.height(20.dp))
                        Button(onClick = onPosted, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)), modifier = Modifier.fillMaxWidth()) { Text("Done") }
                    }
                } else {
                    Text("Post Case Update", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Case #${case.id}", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp, bottom = 16.dp))
                    OutlinedTextField(
                        value = notes, onValueChange = { notes = it },
                        label = { Text("Progress notes...", color = Color.Gray) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                        modifier = Modifier.fillMaxWidth().height(120.dp), shape = RoundedCornerShape(12.dp), maxLines = 5
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
                                            val res = ApiClient.apiService.postCaseUpdate(case.id, body, null)
                                            if (res.isSuccessful) isSuccess = true
                                        } catch (_: Exception) {}
                                        isPosting = false
                                    }
                                }
                            },
                            enabled = !isPosting && notes.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.weight(1f)
                        ) {
                            if (isPosting) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("Post")
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: ADOPTIONS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun AdoptionsTab() {
    val coroutineScope = rememberCoroutineScope()
    var adoptionRequests by remember { mutableStateOf<List<AdoptionRequest>>(emptyList()) }
    var petListings by remember { mutableStateOf<List<PetListing>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var subTab by remember { mutableStateOf(0) }

    val fetchData = {
        coroutineScope.launch {
            isLoading = true
            try {
                val ar = ApiClient.apiService.getNgoAdoptionRequests()
                val pl = ApiClient.apiService.getPetListings()
                if (ar.isSuccessful) adoptionRequests = ar.body() ?: emptyList()
                if (pl.isSuccessful) petListings = pl.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }
    LaunchedEffect(Unit) { fetchData() }

    Column {
        TabRow(selectedTabIndex = subTab, containerColor = Color(0xFF12122A), contentColor = Color.White,
            indicator = { tp -> TabRowDefaults.Indicator(modifier = Modifier.tabIndicatorOffset(tp[subTab]), color = Color(0xFFF59E0B)) }
        ) {
            Tab(selected = subTab == 0, onClick = { subTab = 0 }) { Text("Adoption Requests", Modifier.padding(12.dp), fontSize = 13.sp, color = if (subTab == 0) Color(0xFFF59E0B) else Color.Gray) }
            Tab(selected = subTab == 1, onClick = { subTab = 1 }) { Text("Pet Listings", Modifier.padding(12.dp), fontSize = 13.sp, color = if (subTab == 1) Color(0xFFF59E0B) else Color.Gray) }
        }

        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFF8B5CF6)) }
        } else when (subTab) {
            0 -> {
                val pending = adoptionRequests.filter { it.status == "Pending" }
                if (pending.isEmpty()) {
                    EmptyState("📋", "No pending adoption requests")
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(pending) { req ->
                            AdoptionRequestCard(req,
                                onApprove = { coroutineScope.launch { ApiClient.apiService.updateAdoptionRequestStatus(req.id, StatusUpdateRequest("Approved")); fetchData() } },
                                onReject = { coroutineScope.launch { ApiClient.apiService.updateAdoptionRequestStatus(req.id, StatusUpdateRequest("Rejected")); fetchData() } }
                            )
                        }
                    }
                }
            }
            1 -> {
                val pending = petListings.filter { it.status == "Pending" }
                if (pending.isEmpty()) {
                    EmptyState("🐶", "No pending pet listings to review")
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(pending) { listing ->
                            PetListingCard(listing,
                                onApprove = { coroutineScope.launch { ApiClient.apiService.approvePetListing(listing.id); fetchData() } },
                                onReject = { coroutineScope.launch { ApiClient.apiService.rejectPetListing(listing.id); fetchData() } }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AdoptionRequestCard(req: AdoptionRequest, onApprove: () -> Unit, onReject: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Request #${req.id}", color = Color.White, fontWeight = FontWeight.Bold)
                Text(req.created_at?.take(10) ?: "", color = Color.Gray, fontSize = 11.sp)
            }
            Spacer(Modifier.height(8.dp))
            Text("Pet ID: ${req.pet_id}", color = Color(0xFF94A3B8), fontSize = 13.sp)
            if (req.living_space != null) Text("🏠 ${req.living_space}", color = Color.Gray, fontSize = 12.sp)
            if (req.has_kids != null) Text("👶 Has kids: ${if (req.has_kids) "Yes" else "No"}", color = Color.Gray, fontSize = 12.sp)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onReject, modifier = Modifier.weight(1f), shape = RoundedCornerShape(10.dp)) { Text("✗ Reject", color = Color(0xFFEF4444)) }
                Button(onClick = onApprove, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)), shape = RoundedCornerShape(10.dp)) { Text("✓ Approve") }
            }
        }
    }
}

@Composable
fun PetListingCard(listing: PetListing, onApprove: () -> Unit, onReject: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(44.dp).clip(CircleShape).background(Color(0xFF8B5CF6).copy(0.2f)), contentAlignment = Alignment.Center) {
                    Text(if (listing.species == "Cat") "🐱" else "🐶", fontSize = 22.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(listing.pet_name ?: "Unknown Pet", color = Color.White, fontWeight = FontWeight.Bold)
                    Text("${listing.species ?: "?"} • ${listing.breed ?: "Mixed"} • ${listing.age ?: "?"}", color = Color.Gray, fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("📍 ${listing.location ?: "Location not specified"}", color = Color(0xFF94A3B8), fontSize = 12.sp)
            if (listing.submitted_by != null) Text("Submitted by: ${listing.submitted_by}", color = Color.Gray, fontSize = 11.sp)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onReject, modifier = Modifier.weight(1f), shape = RoundedCornerShape(10.dp)) { Text("✗ Reject", color = Color(0xFFEF4444)) }
                Button(onClick = onApprove, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)), shape = RoundedCornerShape(10.dp)) { Text("✓ Approve") }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: NGO ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun NgoAnalyticsTab() {
    val coroutineScope = rememberCoroutineScope()
    var monthwise by remember { mutableStateOf<List<TimeCount>>(emptyList()) }
    var species by remember { mutableStateOf<List<SpeciesCount>>(emptyList()) }
    var adoptions by remember { mutableStateOf<List<TimeCount>>(emptyList()) }
    var donations by remember { mutableStateOf<List<TimeAmount>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val m = ApiClient.apiService.getNgoCasesMonthwise()
                val s = ApiClient.apiService.getNgoSpecies()
                val a = ApiClient.apiService.getNgoAdoptionStats()
                val d = ApiClient.apiService.getNgoDonationStats()
                if (m.isSuccessful) monthwise = m.body() ?: emptyList()
                if (s.isSuccessful) species = s.body() ?: emptyList()
                if (a.isSuccessful) adoptions = a.body() ?: emptyList()
                if (d.isSuccessful) donations = d.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFF8B5CF6)) }
    } else {
        val totalCases = monthwise.sumOf { it.count }
        val totalAdopted = adoptions.sumOf { it.count }
        val totalDonations = donations.sumOf { it.amount }
        val topSpecies = species.maxByOrNull { it.count }?.species ?: "—"

        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Text("📊 NGO Analytics", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                Text("Your rescue, adoption & donation performance", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AnalyticKpi("📋", "$totalCases", "Cases", Color(0xFFA5B4FC), Modifier.weight(1f))
                    AnalyticKpi("🐾", "$totalAdopted", "Adopted", Color(0xFFF9A8D4), Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AnalyticKpi("💰", "₹${totalDonations.toLong()}", "Donations", Color(0xFFFBBF24), Modifier.weight(1f))
                    AnalyticKpi("🦴", topSpecies, "Top Species", Color(0xFF60A5FA), Modifier.weight(1f))
                }
            }
            if (monthwise.isNotEmpty()) {
                item { BarChartCard("Cases per Month", monthwise.map { it.label to it.count.toFloat() }, Color(0xFF6366F1)) }
            }
            if (adoptions.isNotEmpty()) {
                item { BarChartCard("Adoptions per Month", adoptions.map { it.label to it.count.toFloat() }, Color(0xFF10B981)) }
            }
            if (species.isNotEmpty()) {
                item { SpeciesBreakdownCard(species) }
            }
            if (donations.isNotEmpty()) {
                item { BarChartCard("Donations (₹) per Month", donations.map { it.label to it.amount.toFloat() }, Color(0xFFF59E0B)) }
            }
        }
    }
}

@Composable
fun AnalyticKpi(icon: String, value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(
                Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(color.copy(0.15f)),
                contentAlignment = Alignment.Center
            ) { Text(icon, fontSize = 20.sp) }
            Spacer(Modifier.height(10.dp))
            Text(value, color = color, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
            Text(label, color = Color(0xFF8B8BA7), fontSize = 11.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun BarChartCard(title: String, data: List<Pair<String, Float>>, barColor: Color) {
    if (data.isEmpty()) return
    val maxVal = data.maxOf { it.second }.coerceAtLeast(1f)
    val gradientBrush = Brush.verticalGradient(listOf(barColor, barColor.copy(0.4f)))
    val gridColor = Color.White.copy(0.06f)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                // Peak label
                Card(colors = CardDefaults.cardColors(containerColor = barColor.copy(0.12f)), shape = RoundedCornerShape(8.dp)) {
                    Text("Peak: ${maxVal.toLong()}", color = barColor, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }
            Spacer(Modifier.height(14.dp))
            Canvas(modifier = Modifier.fillMaxWidth().height(160.dp)) {
                val chartHeight = size.height * 0.85f
                val barWidth = (size.width / (data.size * 2.2f)).coerceAtMost(38.dp.toPx())
                val totalSpacing = size.width - barWidth * data.size
                val spacing = totalSpacing / (data.size + 1)

                // Grid lines
                for (i in 0..3) {
                    val y = chartHeight - (chartHeight * i / 3f)
                    drawLine(gridColor, start = Offset(0f, y), end = Offset(size.width, y), strokeWidth = 1.dp.toPx())
                }

                data.forEachIndexed { i, (_, value) ->
                    val barHeight = (value / maxVal) * chartHeight
                    val x = spacing + i * (barWidth + spacing)
                    val y = chartHeight - barHeight

                    // Background track
                    drawRoundRect(color = barColor.copy(0.08f), topLeft = Offset(x, 0f),
                        size = Size(barWidth, chartHeight), cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx()))
                    // Gradient bar
                    drawRoundRect(
                        brush = Brush.verticalGradient(listOf(barColor, barColor.copy(0.5f)), startY = y, endY = chartHeight),
                        topLeft = Offset(x, y), size = Size(barWidth, barHeight),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx())
                    )
                    // Value label area marker (drawn via top glow)
                    if (barHeight > 20.dp.toPx()) {
                        drawRoundRect(color = barColor.copy(0.3f), topLeft = Offset(x, y),
                            size = Size(barWidth, 3.dp.toPx()), cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx()))
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            // Labels row
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                data.forEach { (label, value) ->
                    Column(
                        modifier = Modifier.weight(1f),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(value.toLong().toString(), color = barColor, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        Text(label.take(3), color = Color(0xFF8B8BA7), fontSize = 9.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun SpeciesBreakdownCard(data: List<SpeciesCount>) {
    val total = data.sumOf { it.count }.coerceAtLeast(1)
    val colors = listOf(Color(0xFF8B5CF6), Color(0xFF6366F1), Color(0xFFEC4899), Color(0xFFF59E0B), Color(0xFF10B981))
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text("Cases by Species", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(Modifier.height(14.dp))
            data.forEachIndexed { i, item ->
                val pct = item.count.toFloat() / total
                Column(modifier = Modifier.padding(bottom = 10.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(item.species, color = Color.LightGray, fontSize = 13.sp)
                        Text("${item.count} (${(pct * 100).toInt()}%)", color = colors[i % colors.size], fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(4.dp))
                    Box(Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(Color.White.copy(0.08f))) {
                        Box(Modifier.fillMaxWidth(pct).height(6.dp).clip(CircleShape).background(colors[i % colors.size]))
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun NotificationsTab() {
    val coroutineScope = rememberCoroutineScope()
    var notifications by remember { mutableStateOf<List<NgoNotification>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getNgoNotifications()
                if (res.isSuccessful) {
                    notifications = res.body() ?: emptyList()
                    ApiClient.apiService.markNotificationsRead()
                }
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFF8B5CF6)) }
    } else if (notifications.isEmpty()) {
        EmptyState("🔔", "No notifications yet")
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item { Text("Notifications", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold) }
            items(notifications) { notif ->
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(
                    containerColor = if (!notif.is_read) Color(0xFF1E1A40) else Color(0xFF1A1A2E)
                ), shape = RoundedCornerShape(14.dp)) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                        Box(Modifier.size(36.dp).clip(CircleShape).background(Color(0xFF8B5CF6).copy(0.2f)), contentAlignment = Alignment.Center) {
                            Text("🔔", fontSize = 16.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(notif.message ?: "Notification", color = Color.White, fontSize = 14.sp)
                            Text(notif.created_at?.take(16)?.replace("T", " ") ?: "", color = Color.Gray, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                        if (!notif.is_read) {
                            Box(Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF8B5CF6)))
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SectionHeader(title: String) {
    Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
}

@Composable
fun StatChip(icon: String, count: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text(icon, fontSize = 18.sp)
            Text(count, color = color, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Text(label, color = Color.Gray, fontSize = 11.sp)
        }
    }
}

@Composable
fun EmptyState(icon: String, message: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 56.sp)
            Spacer(Modifier.height(16.dp))
            Text(message, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp, textAlign = TextAlign.Center)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: NGO STORIES – Post Recovery Stories
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NgoStoriesTab() {
    val coroutineScope = rememberCoroutineScope()
    var showPostDialog by remember { mutableStateOf(false) }
    var postedCount by remember { mutableStateOf(0) }
    var successMsg by remember { mutableStateOf<String?>(null) }

    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            // Header card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("📖 Recovery Stories", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(6.dp))
                    Text("Share inspiring rescue stories with the community. Published stories appear in the citizen app feed.", color = Color(0xFF94A3B8), fontSize = 13.sp, lineHeight = 20.sp)
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { showPostDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 14.dp)
                    ) {
                        Text("✨  Publish a Recovery Story", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
        }

        if (successMsg != null) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(0.12f)), shape = RoundedCornerShape(14.dp)) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("✅", fontSize = 24.sp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Story Published!", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
                            Text(successMsg ?: "", color = Color(0xFF94A3B8), fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Tips
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF6366F1).copy(0.08f)), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.padding(16.dp)) {
                    Text("💡 Tips for great stories", color = Color(0xFF6366F1), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(Modifier.height(8.dp))
                    listOf(
                        "🐾 Include the animal's name if known",
                        "📸 Upload a clear before/after photo",
                        "📍 Mention where the rescue happened",
                        "❤️ Describe the rescue journey in detail"
                    ).forEach { tip ->
                        Text(tip, color = Color(0xFF94A3B8), fontSize = 13.sp, modifier = Modifier.padding(vertical = 3.dp))
                    }
                }
            }
        }

        // Impact stats
        item {
            Text("Your Impact", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StoryStatCard("📖", "$postedCount", "Published", Color(0xFF8B5CF6), Modifier.weight(1f))
                StoryStatCard("👥", "—", "Readers", Color(0xFF3B82F6), Modifier.weight(1f))
                StoryStatCard("❤️", "—", "Reactions", Color(0xFFEC4899), Modifier.weight(1f))
            }
        }
    }

    if (showPostDialog) {
        PostStoryDialog(
            onDismiss = { showPostDialog = false },
            onPosted = { title ->
                showPostDialog = false
                postedCount++
                successMsg = "\"$title\" is now live in the citizen feed!"
            }
        )
    }
}

@Composable
fun StoryStatCard(icon: String, value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(12.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 20.sp)
            Text(value, color = color, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Text(label, color = Color.Gray, fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostStoryDialog(onDismiss: () -> Unit, onPosted: (String) -> Unit) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var title by remember { mutableStateOf("") }
    var petName by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isPosting by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    // Media picks
    var photoUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var photoName by remember { mutableStateOf<String?>(null) }
    var videoUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var videoName by remember { mutableStateOf<String?>(null) }
    var videoSize by remember { mutableStateOf<Long?>(null) }

    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { photoUri = it; photoName = it.lastPathSegment?.substringAfterLast('/') ?: "image.jpg" }
    }
    val videoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            videoUri = it
            videoName = it.lastPathSegment?.substringAfterLast('/') ?: "video.mp4"
            videoSize = try { context.contentResolver.openFileDescriptor(it, "r")?.statSize } catch (_: Exception) { null }
        }
    }

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isPosting) onDismiss() }) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            LazyColumn(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Header
                item {
                    Text("📖 Publish Recovery Story", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                    Text("Share your rescue success with the world", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                }

                // Text fields
                item {
                    OutlinedTextField(
                        value = title, onValueChange = { title = it },
                        label = { Text("Story Title *", color = Color.Gray) },
                        placeholder = { Text("e.g. Rocky's Second Chance", color = Color(0xFF444466)) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = petName, onValueChange = { petName = it },
                        label = { Text("Pet Name (optional)", color = Color.Gray) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = description, onValueChange = { description = it },
                        label = { Text("Story Description *", color = Color.Gray) },
                        placeholder = { Text("Describe the rescue journey, recovery, and outcome...", color = Color(0xFF444466)) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)),
                        modifier = Modifier.fillMaxWidth().height(110.dp), shape = RoundedCornerShape(12.dp), maxLines = 6
                    )
                }

                // Media section header
                item {
                    Text("📎 Attach Media", color = Color(0xFF8B8BA7), fontSize = 12.sp, fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(top = 4.dp))
                }

                // Photo picker
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(
                                1.dp,
                                if (photoUri != null) Color(0xFF22C55E) else Color(0xFF2A2A3E),
                                RoundedCornerShape(12.dp)
                            )
                            .background(Color(0xFF12122A))
                            .clickable { photoPicker.launch("image/*") }
                            .padding(14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(40.dp).clip(RoundedCornerShape(10.dp))
                                    .background(if (photoUri != null) Color(0xFF22C55E).copy(0.15f) else Color(0xFF8B5CF6).copy(0.1f)),
                                contentAlignment = Alignment.Center
                            ) { Text(if (photoUri != null) "✅" else "🖼️", fontSize = 20.sp) }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(
                                    if (photoUri != null) "Photo selected" else "Add cover photo (optional)",
                                    color = if (photoUri != null) Color(0xFF22C55E) else Color(0xFF94A3B8),
                                    fontSize = 13.sp, fontWeight = FontWeight.Medium
                                )
                                Text(
                                    if (photoUri != null) photoName ?: "" else "JPG, PNG supported",
                                    color = Color.Gray, fontSize = 11.sp, maxLines = 1
                                )
                            }
                            if (photoUri != null) {
                                TextButton(onClick = { photoUri = null; photoName = null }) {
                                    Text("Remove", color = Color(0xFFEF4444), fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                // Video picker
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(
                                1.dp,
                                if (videoUri != null) Color(0xFF3B82F6) else Color(0xFF2A2A3E),
                                RoundedCornerShape(12.dp)
                            )
                            .background(Color(0xFF12122A))
                            .clickable { videoPicker.launch("video/*") }
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    Modifier.size(40.dp).clip(RoundedCornerShape(10.dp))
                                        .background(if (videoUri != null) Color(0xFF3B82F6).copy(0.15f) else Color(0xFF3B82F6).copy(0.08f)),
                                    contentAlignment = Alignment.Center
                                ) { Text(if (videoUri != null) "🎬" else "📹", fontSize = 20.sp) }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            if (videoUri != null) "Video selected" else "Add rescue video (optional)",
                                            color = if (videoUri != null) Color(0xFF3B82F6) else Color(0xFF94A3B8),
                                            fontSize = 13.sp, fontWeight = FontWeight.Medium
                                        )
                                        Spacer(Modifier.width(6.dp))
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = Color(0xFF3B82F6).copy(0.12f)),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text("OPTIONAL", color = Color(0xFF3B82F6), fontSize = 8.sp, fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp))
                                        }
                                    }
                                    Text(
                                        if (videoUri != null) {
                                            (videoName ?: "") + (videoSize?.let { " • ${it / 1024 / 1024} MB" } ?: "")
                                        } else "MP4, MOV — max 50 MB recommended",
                                        color = Color.Gray, fontSize = 11.sp, maxLines = 1
                                    )
                                }
                                if (videoUri != null) {
                                    TextButton(onClick = { videoUri = null; videoName = null; videoSize = null }) {
                                        Text("Remove", color = Color(0xFFEF4444), fontSize = 11.sp)
                                    }
                                }
                            }
                            // Upload progress bar when video is selected
                            if (videoUri != null && isPosting) {
                                Spacer(Modifier.height(8.dp))
                                LinearProgressIndicator(
                                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(4.dp)),
                                    color = Color(0xFF3B82F6), trackColor = Color(0xFF3B82F6).copy(0.15f)
                                )
                                Text("Uploading video...", color = Color(0xFF3B82F6), fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }

                // Error
                if (errorMsg != null) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF59E0B).copy(0.1f)), shape = RoundedCornerShape(8.dp)) {
                            Text("⚠️ $errorMsg", color = Color(0xFFF59E0B), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                        }
                    }
                }

                // Action buttons
                item {
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(
                            onClick = { if (!isPosting) onDismiss() },
                            modifier = Modifier.weight(1f)
                        ) { Text("Cancel", color = Color.Gray) }

                        Button(
                            onClick = {
                                when {
                                    title.isBlank() -> errorMsg = "Please enter a title."
                                    description.isBlank() -> errorMsg = "Please add a description."
                                    else -> {
                                        isPosting = true; errorMsg = null
                                        coroutineScope.launch {
                                            try {
                                                val titleBody = title.toRequestBody("text/plain".toMediaType())
                                                val descBody = description.toRequestBody("text/plain".toMediaType())
                                                val petBody = petName.toRequestBody("text/plain".toMediaType())

                                                // Build optional photo part
                                                val photoPart = photoUri?.let { uri ->
                                                    val stream = context.contentResolver.openInputStream(uri)
                                                    val bytes = stream?.readBytes() ?: byteArrayOf()
                                                    stream?.close()
                                                    val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
                                                    val reqBody = bytes.toRequestBody(mime.toMediaType())
                                                    MultipartBody.Part.createFormData("photo", photoName ?: "photo.jpg", reqBody)
                                                }

                                                // Build optional video part
                                                val videoPart = videoUri?.let { uri ->
                                                    val stream = context.contentResolver.openInputStream(uri)
                                                    val bytes = stream?.readBytes() ?: byteArrayOf()
                                                    stream?.close()
                                                    val mime = context.contentResolver.getType(uri) ?: "video/mp4"
                                                    val reqBody = bytes.toRequestBody(mime.toMediaType())
                                                    MultipartBody.Part.createFormData("video", videoName ?: "video.mp4", reqBody)
                                                }

                                                val res = ApiClient.apiService.postNgoStory(
                                                    titleBody, descBody, petBody, photoPart, videoPart
                                                )
                                                if (res.isSuccessful) onPosted(title)
                                                else errorMsg = "Failed to publish. Try again."
                                            } catch (_: Exception) { errorMsg = "Network error. Check connection." }
                                            finally { isPosting = false }
                                        }
                                    }
                                }
                            },
                            enabled = !isPosting,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isPosting) {
                                CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(Modifier.width(8.dp))
                                Text("Publishing...", fontWeight = FontWeight.Bold)
                            } else {
                                Text("✨ Publish", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
