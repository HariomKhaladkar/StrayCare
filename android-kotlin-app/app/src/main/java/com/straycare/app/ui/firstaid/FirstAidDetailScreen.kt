package com.straycare.app.ui.firstaid

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.models.FirstAidArticleDetail
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FirstAidDetailScreen(
    articleId: Int,
    onNavigateBack: () -> Unit
) {
    var article by remember { mutableStateOf<FirstAidArticleDetail?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(articleId) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getFirstAidArticleDetail(articleId)
                if (res.isSuccessful) {
                    article = res.body()
                }
            } catch (e: Exception) { }
            finally { isLoading = false }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("First Aid Guide", color = Color.White, fontWeight = FontWeight.Bold) },
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
        } else if (article == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Failed to load guide.", color = Color.Red)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                item {
                    Text(article!!.title, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(article!!.summary, color = Color(0xFFB0B0CC), fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFF1E1E2E))
                }

                item {
                    Text("Steps", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(article!!.content, color = Color.LightGray, fontSize = 14.sp, lineHeight = 22.sp)
                }

                if (article!!.dos.isNotEmpty()) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(alpha = 0.1f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("✅ Do's", color = Color(0xFF22C55E), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                article!!.dos.forEach { 
                                    Text("• $it", color = Color.White, fontSize = 14.sp, modifier = Modifier.padding(bottom = 4.dp))
                                }
                            }
                        }
                    }
                }

                if (article!!.donts.isNotEmpty()) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.1f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("❌ Don'ts", color = Color(0xFFEF4444), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                article!!.donts.forEach { 
                                    Text("• $it", color = Color.White, fontSize = 14.sp, modifier = Modifier.padding(bottom = 4.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
