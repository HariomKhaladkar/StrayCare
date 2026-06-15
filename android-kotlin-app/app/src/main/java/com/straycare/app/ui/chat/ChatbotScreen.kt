package com.straycare.app.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.straycare.app.data.models.ChatMessage
import com.straycare.app.data.models.ChatQuery
import com.straycare.app.data.network.ApiClient
import kotlinx.coroutines.launch

data class Message(val role: String, val text: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatbotScreen(onNavigateBack: () -> Unit) {
    var messages by remember { 
        mutableStateOf(listOf(Message("model", "Hello! I am the **StrayCare AI Assistant** powered by Gemini. I can help with animal first aid, rescue guidance, and anything about the StrayCare app. How can I help you today? \uD83D\uDC3E"))) 
    }
    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("StrayCare AI", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1A1A2E))
            )
        },
        containerColor = Color(0xFF0F0F1A)
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Chat Messages
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(messages) { msg ->
                    ChatBubble(msg)
                    Spacer(modifier = Modifier.height(12.dp))
                }
                if (isLoading) {
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF8B5CF6).copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("\uD83E\uDD16", fontSize = 18.sp)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Card(
                                shape = RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E))
                            ) {
                                PaddingValues(16.dp).let {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp).padding(12.dp),
                                        color = Color(0xFF8B5CF6),
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Input Area
            Surface(
                color = Color(0xFF1A1A2E),
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(12.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Ask me anything about animal care...", color = Color.Gray, fontSize = 14.sp) },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF2A2A3E),
                            unfocusedContainerColor = Color(0xFF2A2A3E),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(24.dp),
                        enabled = !isLoading
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank() && !isLoading) {
                                val userText = inputText
                                inputText = ""
                                messages = messages + Message("user", userText)
                                isLoading = true
                                
                                coroutineScope.launch {
                                    try {
                                        val history = messages.drop(1).map { ChatMessage(it.role, it.text) }
                                        val res = ApiClient.apiService.queryChatbot(ChatQuery(userText, history))
                                        if (res.isSuccessful && res.body() != null) {
                                            messages = messages + Message("model", res.body()!!.response)
                                        } else {
                                            messages = messages + Message("model", "Sorry, I am having trouble connecting to the AI backend. Please try again in a moment.")
                                        }
                                    } catch (e: Exception) {
                                        messages = messages + Message("model", "Sorry, a network error occurred. Please try again.")
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            }
                        },
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(if (inputText.isNotBlank() && !isLoading) Color(0xFF8B5CF6) else Color.Gray)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.padding(start = 4.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: Message) {
    val isAi = message.role == "model" || message.role == "ai"
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isAi) Arrangement.Start else Arrangement.End,
        verticalAlignment = Alignment.Bottom
    ) {
        if (isAi) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF8B5CF6).copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83E\uDD16", fontSize = 18.sp)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Card(
            shape = if (isAi) RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 16.dp) 
                   else RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 16.dp),
            colors = CardDefaults.cardColors(containerColor = if (isAi) Color(0xFF1A1A2E) else Color(0xFF8B5CF6)),
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Text(
                text = message.text.replace("**", ""), // Quick strip of bold markdown for now
                color = Color.White,
                fontSize = 15.sp,
                lineHeight = 22.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
            )
        }
    }
}
