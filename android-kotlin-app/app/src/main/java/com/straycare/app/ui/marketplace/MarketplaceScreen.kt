package com.straycare.app.ui.marketplace

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.straycare.app.data.models.FoodItem
import com.straycare.app.data.models.FoodOrder
import com.straycare.app.data.models.FoodOrderRequest
import com.straycare.app.data.network.ApiClient
import com.straycare.app.data.network.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketplaceScreen() {
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        topBar = {
            TopAppBar(
                title = { Text("Food Marketplace", color = Color.White, fontWeight = FontWeight.ExtraBold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F0F1A))
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
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
                    Text("🛒 Shop", modifier = Modifier.padding(vertical = 14.dp), color = if (selectedTab == 0) Color(0xFF8B5CF6) else Color.Gray)
                }
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                    Text("📦 My Orders", modifier = Modifier.padding(vertical = 14.dp), color = if (selectedTab == 1) Color(0xFF8B5CF6) else Color.Gray)
                }
            }

            when (selectedTab) {
                0 -> ShopTab()
                1 -> MyOrdersTab()
            }
        }
    }
}

@Composable
fun ShopTab() {
    var items by remember { mutableStateOf<List<FoodItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var cartItem by remember { mutableStateOf<FoodItem?>(null) }
    var showCart by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val response = ApiClient.apiService.getFoodItems()
                if (response.isSuccessful) items = response.body() ?: emptyList()
            } catch (e: Exception) {}
            finally { isLoading = false }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(items) { item ->
                FoodItemCard(item, onAddToCart = { cartItem = it; showCart = true })
            }
        }
    }

    if (showCart && cartItem != null) {
        AddToCartDialog(item = cartItem!!, onDismiss = { showCart = false })
    }
}

@Composable
fun FoodItemCard(item: FoodItem, onAddToCart: (FoodItem) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column {
            val url = if (item.image_url?.startsWith("http") == true)
                item.image_url
            else
                "${ApiClient.BASE_URL}${item.image_url}"
            AsyncImage(
                model = url,
                contentDescription = item.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().height(130.dp).background(Color(0xFF2A2A3E))
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(item.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp, maxLines = 1)
                Spacer(modifier = Modifier.height(4.dp))
                Text("₹${String.format("%.0f", item.price)}", color = Color(0xFF22C55E), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { onAddToCart(item) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) { Text("Add to Cart", fontSize = 13.sp) }
            }
        }
    }
}

@Composable
fun AddToCartDialog(item: FoodItem, onDismiss: () -> Unit) {
    var quantity by remember { mutableStateOf(1) }
    var address by remember { mutableStateOf("") }
    var isOrdering by remember { mutableStateOf(false) }
    var isSuccess by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    androidx.compose.ui.window.Dialog(onDismissRequest = { if (!isOrdering) onDismiss() }) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                if (isSuccess) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("✅", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Order Placed!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        Text("Your order for ${item.name} has been placed!", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E))) {
                            Text("Done", fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    Text("Add to Cart", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(item.name, color = Color(0xFF8B5CF6), fontWeight = FontWeight.SemiBold)
                    Text("₹${String.format("%.0f", item.price)} each", color = Color.Gray, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Quantity", color = Color.LightGray, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        OutlinedButton(onClick = { if (quantity > 1) quantity-- }, shape = RoundedCornerShape(8.dp)) { Text("−", color = Color.White, fontSize = 18.sp) }
                        Text("$quantity", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        OutlinedButton(onClick = { quantity++ }, shape = RoundedCornerShape(8.dp)) { Text("+", color = Color.White, fontSize = 18.sp) }
                        Spacer(modifier = Modifier.weight(1f))
                        Text("= ₹${String.format("%.0f", item.price * quantity)}", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Delivery Address", color = Color.Gray) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), maxLines = 2
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel", color = Color.Gray) }
                        Button(
                            onClick = {
                                if (address.isNotBlank()) {
                                    isOrdering = true
                                    coroutineScope.launch(Dispatchers.IO) {
                                        try {
                                            val userName = TokenManager.getUserName()
                                            val userEmail = TokenManager.getUserEmail()
                                            val req = FoodOrderRequest(
                                                product_id = item.id,
                                                quantity = quantity,
                                                buyer_name = userName,
                                                buyer_email = userEmail,
                                                buyer_phone = "9999999999",
                                                delivery_address = address
                                            )
                                            val res = ApiClient.apiService.placeFoodOrder(req)
                                            withContext(Dispatchers.Main) {
                                                isOrdering = false
                                                isSuccess = res.isSuccessful
                                                if (!res.isSuccessful) {
                                                    // Show error but still close dialog
                                                    isSuccess = false
                                                }
                                            }
                                        } catch (e: Exception) {
                                            withContext(Dispatchers.Main) {
                                                isOrdering = false
                                                isSuccess = false
                                            }
                                        }
                                    }
                                }
                            },
                            enabled = !isOrdering && address.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isOrdering) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("Order Now")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MyOrdersTab() {
    var orders by remember { mutableStateOf<List<FoodOrder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = ApiClient.apiService.getFoodOrders()
                if (res.isSuccessful) orders = res.body() ?: emptyList()
            } catch (e: Exception) {}
            finally { isLoading = false }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (orders.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📦", fontSize = 56.sp)
                Spacer(modifier = Modifier.height(16.dp))
                Text("No orders yet!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("Head to the Shop tab to order food\nfor stray animals in your area.", color = Color.Gray, fontSize = 14.sp, modifier = Modifier.padding(top = 8.dp))
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(orders) { order ->
                OrderCard(order)
            }
        }
    }
}

@Composable
fun OrderCard(order: FoodOrder) {
    val (statusColor, statusIcon) = when (order.status) {
        "Confirmed" -> Color(0xFF22C55E) to "✅"
        "Delivered" -> Color(0xFF6366F1) to "🎉"
        "Cancelled" -> Color(0xFFEF4444) to "❌"
        else -> Color(0xFFF59E0B) to "⏳"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text("🛍️ ${order.product_name ?: "Unknown Item"}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Qty: ${order.quantity} • ₹${String.format("%.0f", order.total_price)}", color = Color.Gray, fontSize = 13.sp)
                if (!order.delivery_address.isNullOrBlank()) {
                    Text("📍 ${order.delivery_address}", color = Color.Gray, fontSize = 12.sp, maxLines = 1)
                }
                if (!order.ordered_at.isNullOrBlank()) {
                    Text(order.ordered_at.take(10), color = Color(0xFF6B7280), fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = statusColor.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(20.dp)
            ) {
                Text(
                    "$statusIcon ${order.status ?: "Pending"}",
                    color = statusColor,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }
    }
}
