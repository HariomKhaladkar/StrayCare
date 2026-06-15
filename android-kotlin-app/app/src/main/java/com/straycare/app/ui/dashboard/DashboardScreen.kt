package com.straycare.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.models.Case
import com.straycare.app.data.models.StatsSummary
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToReport: () -> Unit = {},
    onNavigateToChat: () -> Unit = {},
    onNavigateToAdopt: () -> Unit = {},
    onNavigateToMarketplace: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToDonate: () -> Unit = {},
    onNavigateToRecovery: () -> Unit = {},
    onNavigateToFirstAid: () -> Unit = {},
    onNavigateToCaseDetail: (Int) -> Unit = {}
) {
    val userName = TokenManager.getUserName()
    val coroutineScope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current

    var myCases by remember { mutableStateOf<List<Case>>(emptyList()) }
    var stats by remember { mutableStateOf<StatsSummary?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val casesRes = ApiClient.apiService.getMyCases()
                if (casesRes.isSuccessful) myCases = casesRes.body() ?: emptyList()

                val statsRes = ApiClient.apiService.getStatsSummary()
                if (statsRes.isSuccessful) stats = statsRes.body()
            } catch (_: Exception) {}
            finally { isLoading = false }
        }
    }

    val myTotal    = myCases.size
    val myPending  = myCases.count { it.status == "Pending" }
    val myAccepted = myCases.count { it.status == "Accepted" }
    val myResolved = myCases.count { it.status == "Resolved" }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToChat,
                containerColor = Color(0xFF8B5CF6),
                contentColor = Color.White
            ) {
                Text("💬", fontSize = 24.sp)
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // ── Hero Banner ──────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF1A1040), Color(0xFF0F0F1A))
                            )
                        )
                        .padding(horizontal = 20.dp, vertical = 28.dp)
                ) {
                    Column {
                        Text(
                            "Hey, $userName! 👋",
                            color = Color.White,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Thank you for being part of the StrayCare community.\nEvery action saves a life.",
                            color = Color(0xFFB0B0CC),
                            fontSize = 13.sp,
                            lineHeight = 20.sp
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = onNavigateToReport,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("🚨  Report a Case", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = onNavigateToFirstAid,
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF8B5CF6))
                            ) {
                                Text("🩺  First Aid", color = Color(0xFF8B5CF6))
                            }
                        }
                    }
                }
            }

            // ── Live Platform Stats ───────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        "📊  Live Platform Stats",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                    if (isLoading) {
                        Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF8B5CF6))
                        }
                    } else {
                        // Row 1: My Cases + Rescued
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // My Cases card (with breakdown)
                            Card(
                                modifier = Modifier.weight(1f),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("📋", fontSize = 22.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        "$myTotal",
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF8B5CF6)
                                    )
                                    Text("My Reported Cases", color = Color(0xFFB0B0CC), fontSize = 11.sp)
                                    if (myTotal > 0) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        StatusDot(Color(0xFFF59E0B), "Pending", myPending)
                                        StatusDot(Color(0xFF22C55E), "Active", myAccepted)
                                        StatusDot(Color(0xFF6366F1), "Resolved", myResolved)
                                    }
                                }
                            }
                            // Animals Rescued
                            KpiCard("🐾", stats?.resolved_cases ?: 0, "Animals Rescued",
                                Brush.linearGradient(listOf(Color(0xFF14B8A6), Color(0xFF6366F1))))
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Row 2: Pets Adopted + Partner NGOs
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard("🏠", stats?.total_adoptions ?: 0, "Pets Adopted",
                                Brush.linearGradient(listOf(Color(0xFFEC4899), Color(0xFFF97316))))
                            KpiCard("🏥", stats?.ngo_count ?: 0, "Partner NGOs",
                                Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFEF4444))))
                        }
                    }
                }
            }

            // ── Quick Action Cards ────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(
                        "More Actions",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 24.dp, bottom = 16.dp)
                    )
                    QuickActionCard("📋", "My Reported Cases",
                        "Track cases you've reported. Leave feedback on resolved ones.",
                        Color(0xFF3B82F6), onNavigateToProfile)
                    Spacer(modifier = Modifier.height(12.dp))
                    QuickActionCard("💛", "Donate to an NGO",
                        "Support verified rescue organisations financially. Every rupee counts.",
                        Color(0xFFF59E0B), onNavigateToDonate)
                    Spacer(modifier = Modifier.height(12.dp))
                    QuickActionCard("🏠", "List a Pet for Adoption",
                        "Submit a personal pet for NGO review and community rehoming.",
                        Color(0xFF8B5CF6), onNavigateToAdopt)
                    Spacer(modifier = Modifier.height(12.dp))
                    QuickActionCard("🌟", "Recovery Stories",
                        "Real success stories of animals rescued by our partner NGOs.",
                        Color(0xFF6366F1), onNavigateToRecovery)
                    Spacer(modifier = Modifier.height(12.dp))
                    QuickActionCard("📦", "My Food Orders",
                        "Track the delivery status of your food orders for stray animals.",
                        Color(0xFFF97316), onNavigateToMarketplace)
                }
            }
        }
    }
}

@Composable
fun RowScope.KpiCard(icon: String, value: Int, label: String, gradient: Brush) {
    Card(
        modifier = Modifier.weight(1f),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(icon, fontSize = 22.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "$value",
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF8B5CF6)
            )
            Text(label, color = Color(0xFFB0B0CC), fontSize = 11.sp)
        }
    }
}

@Composable
fun StatusDot(color: Color, label: String, count: Int) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 1.dp)) {
        Box(modifier = Modifier.size(7.dp).clip(RoundedCornerShape(50)).background(color))
        Spacer(modifier = Modifier.width(5.dp))
        Text("$label: ", color = Color(0xFFB0B0CC), fontSize = 10.sp)
        Text("$count", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickActionCard(icon: String, title: String, description: String, accentColor: Color, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(icon, fontSize = 22.sp)
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(description, color = Color(0xFF8B8BA7), fontSize = 12.sp, lineHeight = 17.sp)
            }
            Text("→", color = accentColor, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }
    }
}
