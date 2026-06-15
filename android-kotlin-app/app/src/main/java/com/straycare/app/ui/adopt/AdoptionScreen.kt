package com.straycare.app.ui.adopt

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.MatchProfile
import com.straycare.app.data.models.Pet
import com.straycare.app.data.models.PetMatchResponse
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdoptionScreen(onNavigateToPetDetail: (Int) -> Unit = {}) {
    var selectedTab by remember { mutableStateOf(0) }
    var showListPetDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            TopAppBar(
                title = { Text("Adopt a Pet", color = Color.White, fontWeight = FontWeight.ExtraBold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F0F1A))
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showListPetDialog = true },
                containerColor = Color(0xFF8B5CF6),
                contentColor = Color.White,
                shape = CircleShape
            ) { Text("+", fontSize = 28.sp, fontWeight = FontWeight.Light) }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color(0xFF1A1A2E),
                contentColor = Color.White,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = Color(0xFF8B5CF6)
                    )
                }
            ) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                    Text("🐾 All Pets", modifier = Modifier.padding(vertical = 14.dp), color = if (selectedTab == 0) Color(0xFF8B5CF6) else Color.Gray)
                }
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                    Text("🤖 AI Match", modifier = Modifier.padding(vertical = 14.dp), color = if (selectedTab == 1) Color(0xFF8B5CF6) else Color.Gray)
                }
            }
            if (selectedTab == 0) AllPetsTab(onNavigateToPetDetail = onNavigateToPetDetail)
            else AIMatchmakerTab(onNavigateToPetDetail = onNavigateToPetDetail)
        }
    }

    if (showListPetDialog) {
        ListPetDialog(onDismiss = { showListPetDialog = false })
    }
}

@Composable
fun AllPetsTab(onNavigateToPetDetail: (Int) -> Unit = {}) {
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getPets()
                if (res.isSuccessful) pets = res.body() ?: emptyList()
            } catch (_: Exception) {} finally { isLoading = false }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (pets.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🐾", fontSize = 56.sp)
                Spacer(Modifier.height(16.dp))
                Text("No pets available yet", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("Check back soon!", color = Color.Gray)
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Text("${pets.size} pets looking for a home 🏠", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(bottom = 4.dp))
            }
            items(pets) { pet -> PetCard(pet, onTap = { onNavigateToPetDetail(pet.id) }) }
        }
    }
}

@Composable
fun AIMatchmakerTab(onNavigateToPetDetail: (Int) -> Unit = {}) {
    var livingSpace by remember { mutableStateOf("apartment") }
    var activityLevel by remember { mutableStateOf("medium") }
    var hasKids by remember { mutableStateOf(false) }
    var matches by remember { mutableStateOf<List<PetMatchResponse>?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    if (matches == null) {
        LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Text("🤖 AI Pet Matchmaker", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                Text("Tell us about yourself and we'll find your perfect companion!", color = Color.Gray, fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("🏠 Living Space", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            listOf("apartment" to "🏢 Apartment", "house" to "🏠 House").forEach { (value, label) ->
                                val selected = livingSpace == value
                                Card(
                                    modifier = Modifier.weight(1f).clickable { livingSpace = value },
                                    colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFF8B5CF6).copy(0.2f) else Color(0xFF12122A)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Box(Modifier.fillMaxWidth().padding(12.dp), contentAlignment = Alignment.Center) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(label.split(" ")[0], fontSize = 24.sp)
                                            Text(label.split(" ")[1], color = if (selected) Color(0xFF8B5CF6) else Color.Gray, fontSize = 13.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("⚡ Activity Level", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("low" to "🐢 Low", "medium" to "🚶 Medium", "high" to "🏃 High").forEach { (value, label) ->
                                val selected = activityLevel == value
                                Card(
                                    modifier = Modifier.weight(1f).clickable { activityLevel = value },
                                    colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFF6366F1).copy(0.2f) else Color(0xFF12122A)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(label.split(" ")[0], fontSize = 20.sp)
                                        Text(label.split(" ")[1], color = if (selected) Color(0xFF6366F1) else Color.Gray, fontSize = 11.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(16.dp)) {
                    Row(Modifier.padding(16.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("👶 Have Kids at Home?", color = Color.White, fontWeight = FontWeight.Bold)
                            Text("We'll find kid-friendly pets", color = Color.Gray, fontSize = 12.sp)
                        }
                        Switch(checked = hasKids, onCheckedChange = { hasKids = it }, colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = Color(0xFF8B5CF6)))
                    }
                }
            }
            item {
                Button(
                    onClick = {
                        isLoading = true
                        coroutineScope.launch {
                            try {
                                val res = ApiClient.apiService.matchPets(MatchProfile(livingSpace, activityLevel, hasKids))
                                if (res.isSuccessful) matches = res.body()
                            } catch (_: Exception) {} finally { isLoading = false }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.width(10.dp))
                        Text("Finding your match...")
                    } else {
                        Text("✨ Find My Perfect Pet", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("Your Matches 🎯", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                        Text("${matches!!.size} compatible companions found", color = Color.Gray, fontSize = 13.sp)
                    }
                    TextButton(onClick = { matches = null }) { Text("Try Again", color = Color(0xFF8B5CF6)) }
                }
            }
            items(matches!!) { match ->
                PetCard(match.pet, matchPercentage = match.match_percentage, onTap = { onNavigateToPetDetail(match.pet.id) })
            }
        }
    }
}

@Composable
fun PetCard(pet: Pet, matchPercentage: Int? = null, onTap: () -> Unit = {}) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onTap),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(18.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            Box(Modifier.fillMaxWidth().height(200.dp)) {
                val url = if (pet.image_url.startsWith("http")) pet.image_url else "${ApiClient.BASE_URL}${pet.image_url}"
                AsyncImage(
                    model = url, contentDescription = pet.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
                )
                Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF1A1A2E)), startY = 100f)))

                // Match badge
                if (matchPercentage != null) {
                    Box(Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.TopEnd) {
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(0.9f)), shape = RoundedCornerShape(20.dp)) {
                            Text("$matchPercentage% Match", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                        }
                    }
                }
                // Status badge
                Box(Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.TopStart) {
                    val statusColor = if (pet.status == "Available") Color(0xFF22C55E) else Color(0xFFEF4444)
                    Card(colors = CardDefaults.cardColors(containerColor = statusColor.copy(0.85f)), shape = RoundedCornerShape(20.dp)) {
                        Text(pet.status, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                    }
                }
            }

            Column(Modifier.padding(14.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(pet.name, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                    Text(if (pet.gender == "Male") "♂" else "♀", color = if (pet.gender == "Male") Color(0xFF3B82F6) else Color(0xFFEC4899), fontSize = 22.sp, fontWeight = FontWeight.Bold)
                }
                Text("${pet.breed} • ${pet.age}", color = Color(0xFF94A3B8), fontSize = 14.sp, modifier = Modifier.padding(top = 2.dp))
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    SmallChip(if (pet.is_vaccinated) "💉 Vaccinated" else "⚠️ Unvaccinated", if (pet.is_vaccinated) Color(0xFF22C55E) else Color(0xFFF59E0B))
                    SmallChip("📍 ${pet.location.take(12)}", Color(0xFF3B82F6))
                }
                Spacer(Modifier.height(10.dp))
                Text("Tap to view full profile →", color = Color(0xFF8B5CF6), fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
fun SmallChip(text: String, color: Color) {
    Card(colors = CardDefaults.cardColors(containerColor = color.copy(0.12f)), shape = RoundedCornerShape(20.dp)) {
        Text(text, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListPetDialog(onDismiss: () -> Unit) {
    var petName by remember { mutableStateOf("") }
    var species by remember { mutableStateOf("Dog") }
    var breed by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var isSubmitted by remember { mutableStateOf(false) }
    var isSubmitting by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isSubmitting) onDismiss() }) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(24.dp)) {
            Column(modifier = Modifier.padding(24.dp)) {
                if (isSubmitted) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("🐾", fontSize = 48.sp)
                        Spacer(Modifier.height(16.dp))
                        Text("Submitted for Review!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Our partner NGOs will review your listing.", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp), )
                        Spacer(Modifier.height(24.dp))
                        Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)), modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                            Text("Got it!", fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    Text("List a Pet for Adoption", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Submit for NGO review.", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp, bottom = 16.dp))
                    OutlinedTextField(value = petName, onValueChange = { petName = it }, label = { Text("Pet Name", color = Color.Gray) }, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)), singleLine = true, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                    Spacer(Modifier.height(10.dp))
                    Text("Species", color = Color.LightGray, fontSize = 13.sp)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        listOf("Dog", "Cat", "Other").forEach { s ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(selected = species == s, onClick = { species = s }, colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF8B5CF6)))
                                Text(s, color = Color.White, fontSize = 13.sp)
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(value = breed, onValueChange = { breed = it }, label = { Text("Breed / Description", color = Color.Gray) }, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)), singleLine = true, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(value = age, onValueChange = { age = it }, label = { Text("Age", color = Color.Gray) }, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)), singleLine = true, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = location, onValueChange = { location = it }, label = { Text("Location", color = Color.Gray) }, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)), singleLine = true, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                    }
                    Spacer(Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel", color = Color.Gray) }
                        Button(
                            onClick = {
                                if (petName.isNotBlank() && location.isNotBlank()) {
                                    isSubmitting = true
                                    coroutineScope.launch {
                                        kotlinx.coroutines.delay(1500)
                                        isSubmitting = false
                                        isSubmitted = true
                                    }
                                }
                            },
                            enabled = !isSubmitting && petName.isNotBlank() && location.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isSubmitting) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("Submit")
                        }
                    }
                }
            }
        }
    }
}
