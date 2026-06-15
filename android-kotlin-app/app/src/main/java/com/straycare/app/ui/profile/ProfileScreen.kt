package com.straycare.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
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
import com.straycare.app.data.models.User
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(onLogout: () -> Unit = {}, onNavigateToCaseDetail: (Int) -> Unit = {}) {
    val coroutineScope = rememberCoroutineScope()
    var user by remember { mutableStateOf<User?>(null) }
    var myCases by remember { mutableStateOf<List<Case>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val userRes = ApiClient.apiService.getCurrentUser()
                if (userRes.isSuccessful) user = userRes.body()

                val casesRes = ApiClient.apiService.getMyCases()
                if (casesRes.isSuccessful) myCases = casesRes.body() ?: emptyList()
            } catch (_: Exception) {}
            finally { isLoading = false }
        }
    }

    val resolved = myCases.count { it.status == "Resolved" }
    val pending  = myCases.count { it.status == "Pending" }
    val accepted = myCases.count { it.status == "Accepted" }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            TopAppBar(
                title = { Text("My Profile", color = Color.White, fontWeight = FontWeight.ExtraBold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F0F1A))
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Avatar + Info card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp).fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Avatar circle with initials
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                val initials = user?.name?.split(" ")
                                    ?.mapNotNull { it.firstOrNull()?.uppercaseChar() }
                                    ?.take(2)?.joinToString("") ?: "U"
                                Text(initials, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                user?.name ?: TokenManager.getUserName(),
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                user?.email ?: TokenManager.getUserEmail(),
                                color = Color(0xFF8B8BA7),
                                fontSize = 14.sp
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Points badge
                            val points = user?.points ?: 0
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFF8B5CF6).copy(alpha = 0.2f))
                                    .padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text("⭐  $points Points", color = Color(0xFF8B5CF6), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                // My Case Stats
                item {
                    Text("My Case Activity", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        ProfileStatCard("📋", "${myCases.size}", "Total", Color(0xFF6366F1), Modifier.weight(1f))
                        ProfileStatCard("⏳", "$pending", "Pending", Color(0xFFF59E0B), Modifier.weight(1f))
                        ProfileStatCard("✅", "$resolved", "Resolved", Color(0xFF22C55E), Modifier.weight(1f))
                    }
                }

                // My Cases list (recent 3)
                if (myCases.isNotEmpty()) {
                    item {
                        Text("Recent Cases", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                    items(minOf(myCases.size, 3)) { idx ->
                        val c = myCases[idx]
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { onNavigateToCaseDetail(c.id) },
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Case #${c.id}", color = Color.White, fontWeight = FontWeight.Bold)
                                    val safeDesc = c.description ?: "No description provided."
                                    Text(safeDesc.take(60) + if (safeDesc.length > 60) "…" else "",
                                        color = Color(0xFF8B8BA7), fontSize = 12.sp)
                                }
                                val statusColor = when(c.status ?: "Pending") {
                                    "Resolved" -> Color(0xFF22C55E)
                                    "Accepted" -> Color(0xFF3B82F6)
                                    else -> Color(0xFFF59E0B)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(statusColor.copy(alpha = 0.15f))
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text(c.status ?: "Pending", color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Logout
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            TokenManager.clearAll()
                            onLogout()
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A2E))
                    ) {
                        Text("🚪  Log Out", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileStatCard(icon: String, value: String, label: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(icon, fontSize = 20.sp)
            Text(value, color = color, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Text(label, color = Color(0xFF8B8BA7), fontSize = 11.sp)
        }
    }
}
