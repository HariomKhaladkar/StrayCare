package com.straycare.app.ui.firstaid

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.models.FirstAidArticle
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FirstAidScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetail: (Int) -> Unit
) {
    var articles by remember { mutableStateOf<List<FirstAidArticle>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getFirstAidArticles()
                if (res.isSuccessful) {
                    articles = res.body() ?: emptyList()
                } else {
                    errorMessage = "Failed to load guides: ${res.code()}"
                }
            } catch (e: Exception) {
                errorMessage = "Network error"
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Emergency First Aid", color = Color.White, fontWeight = FontWeight.Bold) },
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
        } else if (errorMessage != null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(errorMessage!!, color = Color.Red)
            }
        } else if (articles.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("No first aid guides available.", color = Color.Gray)
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
                                modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFEF4444).copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) { Text("🚑", fontSize = 20.sp) }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Emergency Guidelines", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Quick actions can save an animal's life. Always call a vet.", color = Color(0xFFB0B0CC), fontSize = 12.sp)
                            }
                        }
                    }
                }

                items(articles) { article ->
                    FirstAidCard(article, onNavigateToDetail)
                }
            }
        }
    }
}

@Composable
fun FirstAidCard(article: FirstAidArticle, onClick: (Int) -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick(article.id) },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            val emoji = when (article.animal_type.lowercase()) {
                "dog" -> "🐕"
                "cat" -> "🐈"
                "bird" -> "🐦"
                "cow" -> "🐄"
                else -> "🐾"
            }
            Box(
                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF8B5CF6).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) { Text(emoji, fontSize = 24.sp) }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(article.title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(article.summary, color = Color.LightGray, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(color = Color(0xFF1E1A40), shape = RoundedCornerShape(4.dp)) {
                        Text(article.category, color = Color(0xFF8B5CF6), fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }
        }
    }
}
