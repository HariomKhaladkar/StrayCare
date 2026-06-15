package com.straycare.app.ui.petdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.Pet
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PetDetailScreen(petId: Int, onBack: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    val role = TokenManager.getUserRole()

    var pet by remember { mutableStateOf<Pet?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var adoptionState by remember { mutableStateOf<String?>(null) } // null, "requesting", "done", "error"
    var isFavourited by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getPetDetail(petId)
                if (res.isSuccessful) pet = res.body()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            TopAppBar(
                title = { Text(pet?.name ?: "Pet Profile", color = Color.White, fontWeight = FontWeight.ExtraBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { isFavourited = !isFavourited }) {
                        Icon(
                            if (isFavourited) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favourite",
                            tint = if (isFavourited) Color(0xFFEC4899) else Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F0F1A))
            )
        },
        bottomBar = {
            if (!isLoading && pet != null && role.lowercase() == "citizen") {
                val p = pet!!
                val available = p.status == "Available"
                Box(Modifier.fillMaxWidth().background(Color(0xFF0F0F1A)).padding(16.dp)) {
                    when (adoptionState) {
                        "done" -> Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(0.15f)), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("✅ Adoption Request Submitted! The NGO will review your request.", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp), lineHeight = 22.sp)
                        }
                        "error" -> Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.1f)), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("❌ Could not send request. Try again later.", color = Color(0xFFEF4444), modifier = Modifier.padding(16.dp))
                        }
                        else -> Button(
                            onClick = {
                                if (available && adoptionState == null) {
                                    adoptionState = "requesting"
                                    coroutineScope.launch {
                                        try {
                                            val res = ApiClient.apiService.requestAdoption(petId)
                                            adoptionState = if (res.isSuccessful) "done" else "error"
                                        } catch (_: Exception) { adoptionState = "error" }
                                    }
                                }
                            },
                            enabled = available && adoptionState != "requesting",
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (available) Color(0xFF8B5CF6) else Color(0xFF2A2A3E)
                            ),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(vertical = 16.dp)
                        ) {
                            if (adoptionState == "requesting") {
                                CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(Modifier.width(8.dp))
                            }
                            Text(
                                if (!available) "🏠 Already Adopted"
                                else if (adoptionState == "requesting") "Sending Request..."
                                else "🐾 Request to Adopt",
                                fontWeight = FontWeight.Bold, fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else {
            val p = pet
            if (p == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Pet not found.", color = Color.Gray)
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(bottom = 24.dp)) {

                    // ── Hero Image ────────────────────────────────────
                    item {
                        Box(Modifier.fillMaxWidth().height(300.dp)) {
                            val imgUrl = if (p.image_url.startsWith("http")) p.image_url else "${ApiClient.BASE_URL}${p.image_url}"
                            AsyncImage(
                                model = imgUrl, contentDescription = p.name,
                                contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize()
                            )
                            Box(Modifier.fillMaxSize().background(
                                Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF0F0F1A)), startY = 150f)
                            ))
                            // Status badge
                            Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.BottomStart) {
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (p.status == "Available") Color(0xFF22C55E).copy(0.9f) else Color(0xFFEF4444).copy(0.9f)
                                    ), shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text(
                                        if (p.status == "Available") "✅ Available for Adoption" else "🏠 ${p.status}",
                                        color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                                    )
                                }
                            }
                        }
                    }

                    // ── Name + Basic Info ─────────────────────────────
                    item {
                        Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                            Text(p.name, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                            Text("${p.species} • ${p.breed}", color = Color(0xFF94A3B8), fontSize = 16.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                    }

                    // ── Attribute Chips ───────────────────────────────
                    item {
                        Row(
                            Modifier.padding(horizontal = 16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            PetAttributeChip("🎂", p.age, Color(0xFFF59E0B))
                            PetAttributeChip(if (p.gender == "Male") "♂" else "♀", p.gender, if (p.gender == "Male") Color(0xFF3B82F6) else Color(0xFFEC4899))
                            PetAttributeChip("📏", p.size, Color(0xFF8B5CF6))
                        }
                    }

                    // ── Vaccination + Location ────────────────────────
                    item {
                        Spacer(Modifier.height(10.dp))
                        Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = if (p.is_vaccinated) Color(0xFF22C55E).copy(0.1f) else Color(0xFFEF4444).copy(0.1f)
                                ), shape = RoundedCornerShape(12.dp), modifier = Modifier.weight(1f)
                            ) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(if (p.is_vaccinated) "💉" else "⚠️", fontSize = 18.sp)
                                    Spacer(Modifier.width(8.dp))
                                    Column {
                                        Text("Vaccination", color = Color.Gray, fontSize = 11.sp)
                                        Text(if (p.is_vaccinated) "Vaccinated" else "Not Vaccinated",
                                            color = if (p.is_vaccinated) Color(0xFF22C55E) else Color(0xFFEF4444), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }
                            }
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF3B82F6).copy(0.1f)), shape = RoundedCornerShape(12.dp), modifier = Modifier.weight(1f)) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text("📍", fontSize = 18.sp)
                                    Spacer(Modifier.width(8.dp))
                                    Column {
                                        Text("Location", color = Color.Gray, fontSize = 11.sp)
                                        Text(p.location, color = Color(0xFF3B82F6), fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1)
                                    }
                                }
                            }
                        }
                    }

                    // ── About Section ─────────────────────────────────
                    item {
                        Spacer(Modifier.height(16.dp))
                        Column(Modifier.padding(horizontal = 16.dp)) {
                            Text("About ${p.name}", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                AboutItem("🐾", "Species", p.species)
                                AboutItem("🧬", "Breed", p.breed)
                                AboutItem("🎂", "Age", p.age)
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                AboutItem(if (p.gender == "Male") "♂" else "♀", "Gender", p.gender)
                                AboutItem("📏", "Size", p.size)
                                AboutItem("💉", "Vaccinated", if (p.is_vaccinated) "Yes" else "No")
                            }
                        }
                    }

                    // ── Adoption Tips ─────────────────────────────────
                    item {
                        Spacer(Modifier.height(16.dp))
                        Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
                            Column(Modifier.padding(16.dp)) {
                                Text("💡 Adoption Process", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Spacer(Modifier.height(10.dp))
                                listOf(
                                    "1️⃣  Submit your adoption request",
                                    "2️⃣  NGO reviews your living situation",
                                    "3️⃣  Home visit or online interview",
                                    "4️⃣  Approve & pick up your new family member!"
                                ).forEach { step ->
                                    Text(step, color = Color(0xFF94A3B8), fontSize = 13.sp, modifier = Modifier.padding(vertical = 3.dp))
                                }
                            }
                        }
                    }

                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }
}

@Composable
fun PetAttributeChip(icon: String, text: String, color: Color) {
    Card(colors = CardDefaults.cardColors(containerColor = color.copy(0.12f)), shape = RoundedCornerShape(20.dp)) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(icon, fontSize = 14.sp)
            Spacer(Modifier.width(5.dp))
            Text(text, color = color, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

@Composable
fun AboutItem(icon: String, label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(icon, fontSize = 20.sp)
        Text(label, color = Color.Gray, fontSize = 10.sp)
        Text(value, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
