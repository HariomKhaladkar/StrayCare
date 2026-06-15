package com.straycare.app.ui.recovery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.RecoveryStory
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecoveryStoriesScreen(onNavigateBack: () -> Unit) {
    val coroutineScope = rememberCoroutineScope()
    var stories by remember { mutableStateOf<List<RecoveryStory>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getRecoveryStories()
                if (res.isSuccessful) stories = res.body() ?: emptyList()
            } catch (e: Exception) {}
            finally { isLoading = false }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Recovery Stories", color = Color.White, fontWeight = FontWeight.Bold) },
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
                    Text(
                        "Heart-warming stories of rescues and adoptions from our partner NGOs. 🌟",
                        color = Color(0xFFB0B0CC),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                if (stories.isEmpty()) {
                    item {
                        Text("No recovery stories found. Check back later!", color = Color.Gray)
                    }
                } else {
                    items(stories) { story ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column {
                                if (story.image_url != null) {
                                    AsyncImage(
                                        model = "http://10.225.114.63:8000/${story.image_url}",
                                        contentDescription = "Story Photo",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(200.dp)
                                    )
                                } else {
                                    Box(modifier = Modifier.fillMaxWidth().height(160.dp).background(Color(0xFF2E2E48)), contentAlignment = Alignment.Center) {
                                        Text("🐾", fontSize = 48.sp)
                                    }
                                }
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(story.title ?: "Untitled Story", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Posted on ${story.date_posted ?: "Unknown Date"}", color = Color(0xFF8B5CF6), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(story.description ?: "No description available.", color = Color.LightGray, fontSize = 14.sp, lineHeight = 20.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
