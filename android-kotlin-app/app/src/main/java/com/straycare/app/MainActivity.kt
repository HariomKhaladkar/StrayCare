package com.straycare.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.straycare.app.data.network.TokenManager
import com.straycare.app.ui.adopt.AdoptionScreen
import com.straycare.app.ui.auth.LoginScreen
import com.straycare.app.ui.auth.NgoLoginScreen
import com.straycare.app.ui.dashboard.DashboardScreen

import com.razorpay.PaymentResultWithDataListener
import com.razorpay.PaymentData
import com.straycare.app.data.models.RazorpayVerifyRequest
import com.straycare.app.data.network.ApiClient
import com.straycare.app.ui.marketplace.MarketplaceScreen
import com.straycare.app.ui.profile.ProfileScreen
import com.straycare.app.ui.reportcase.ReportCaseScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity(), PaymentResultWithDataListener {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            android.util.Log.e("STRAYCARE_CRASH", "FATAL CRASH", exception)
            defaultHandler?.uncaughtException(thread, exception)
        }

        TokenManager.init(applicationContext)
        setContent {
            MaterialTheme {
                StrayCareApp()
            }
        }
    }

    override fun onPaymentSuccess(paymentId: String?, paymentData: PaymentData?) {
        android.util.Log.d("RAZORPAY", "Payment Successful: $paymentId")
        if (paymentId != null && paymentData != null) {
            val orderId = paymentData.orderId
            val signature = paymentData.signature
            
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val verifyRes = ApiClient.apiService.verifyRazorpayPayment(
                        RazorpayVerifyRequest(
                            payment_id = paymentId,
                            order_id = orderId,
                            signature = signature
                        )
                    )
                    launch(Dispatchers.Main) {
                        if (verifyRes.isSuccessful) {
                            android.widget.Toast.makeText(this@MainActivity, "Donation verified and successful! Thank you 💛", android.widget.Toast.LENGTH_LONG).show()
                        } else {
                            android.widget.Toast.makeText(this@MainActivity, "Payment received but verification failed.", android.widget.Toast.LENGTH_LONG).show()
                        }
                    }
                } catch (e: Exception) {
                    launch(Dispatchers.Main) {
                        android.widget.Toast.makeText(this@MainActivity, "Donation successful! Thank you 💛", android.widget.Toast.LENGTH_LONG).show()
                    }
                }
            }
        } else {
            android.widget.Toast.makeText(this, "Donation successful! Thank you 💛", android.widget.Toast.LENGTH_LONG).show()
        }
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        android.util.Log.e("RAZORPAY", "Payment Error $code: $response")
        val msg = when (code) {
            0 -> "Network error. Please try again."
            1 -> "Payment cancelled."
            2 -> "Invalid options."
            else -> "Payment failed. Please try again."
        }
        android.widget.Toast.makeText(this, msg, android.widget.Toast.LENGTH_LONG).show()
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard   : Screen("dashboard",    "Home",    Icons.Filled.Home)
    object ReportCase  : Screen("report_case",  "Report",  Icons.Filled.Warning)
    object Adopt       : Screen("adopt",        "Adopt",   Icons.Filled.Favorite)
    object Marketplace : Screen("marketplace",  "Shop",    Icons.Filled.ShoppingCart)
    object Profile     : Screen("profile",      "Profile", Icons.Filled.Person)
    object NgoDashboard: Screen("ngo_dashboard","Cases",   Icons.Filled.Home)
    object Donate      : Screen("donate",       "Donate",  Icons.Filled.Favorite)
    object Recovery    : Screen("recovery_stories", "Stories", Icons.Filled.Home)
}

private val CITIZEN_TABS = listOf(
    Screen.Dashboard, Screen.ReportCase, Screen.Adopt, Screen.Marketplace, Screen.Profile
)
private val NGO_TABS = listOf(Screen.NgoDashboard)

// Routes where bottom bar should be completely hidden
private val NO_BOTTOM_BAR_ROUTES = setOf(
    "login", "ngo_login", "admin_dashboard",
    Screen.NgoDashboard.route,
    "chatbot", "case_detail/{caseId}", "pet_detail/{petId}",
    Screen.Donate.route, Screen.Recovery.route
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StrayCareApp() {
    val navController = rememberNavController()

    Scaffold(
        containerColor = Color(0xFF0F0F1A),
        bottomBar = {
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route

            if (currentRoute !in NO_BOTTOM_BAR_ROUTES) {
                val tabs = if (currentRoute?.startsWith("ngo") == true) NGO_TABS else CITIZEN_TABS

                NavigationBar(containerColor = Color(0xFF0F0F1A)) {
                    tabs.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = navBackStackEntry?.destination?.hierarchy
                                ?.any { it.route == screen.route } == true,
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor   = Color(0xFF8B5CF6),
                                unselectedIconColor = Color(0xFF5A5A7A),
                                selectedTextColor   = Color(0xFF8B5CF6),
                                unselectedTextColor = Color(0xFF5A5A7A),
                                indicatorColor      = Color(0xFF1E1E2E)
                            ),
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "login",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("login") {
                LoginScreen(
                    onLoginSuccess = {
                        val role = TokenManager.getUserRole()
                        val destination = when (role.lowercase()) {
                            "admin" -> "admin_dashboard"
                            "ngo"   -> Screen.NgoDashboard.route
                            else    -> Screen.Dashboard.route
                        }
                        navController.navigate(destination) {
                            popUpTo(0) { inclusive = true }  // clear entire backstack
                            launchSingleTop = true
                        }
                    },
                    onNgoLogin = { navController.navigate("ngo_login") }
                )
            }
            composable("ngo_login") {
                NgoLoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.NgoDashboard.route) {
                            popUpTo("ngo_login") { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onNavigateToReport = { navController.navigate(Screen.ReportCase.route) },
                    onNavigateToChat = { navController.navigate("chatbot") },
                    onNavigateToAdopt = { navController.navigate(Screen.Adopt.route) },
                    onNavigateToMarketplace = { navController.navigate(Screen.Marketplace.route) },
                    onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                    onNavigateToDonate = { navController.navigate(Screen.Donate.route) },
                    onNavigateToRecovery = { navController.navigate(Screen.Recovery.route) },
                    onNavigateToCaseDetail = { id -> navController.navigate("case_detail/$id") }
                )
            }
            composable("chatbot") {
                com.straycare.app.ui.chat.ChatbotScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable("admin_dashboard") {
                com.straycare.app.ui.admin.AdminDashboardScreen(
                    onNavigateToCaseDetail = { id -> navController.navigate("case_detail/$id") },
                    onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
                )
            }
            composable(Screen.NgoDashboard.route) {
                com.straycare.app.ui.ngo.NGODashboardScreen(
                    onNavigateToCaseDetail = { id -> navController.navigate("case_detail/$id") },
                    onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
                )
            }
            composable(Screen.ReportCase.route)   { ReportCaseScreen() }
            composable(Screen.Adopt.route) {
                AdoptionScreen(onNavigateToPetDetail = { id -> navController.navigate("pet_detail/$id") })
            }
            composable(Screen.Marketplace.route)   { MarketplaceScreen() }
            composable(Screen.Profile.route) {
                ProfileScreen(
                    onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } },
                    onNavigateToCaseDetail = { id -> navController.navigate("case_detail/$id") }
                )
            }
            composable(Screen.Donate.route) {
                com.straycare.app.ui.donate.DonateScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.Recovery.route) {
                com.straycare.app.ui.recovery.RecoveryStoriesScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable("case_detail/{caseId}") { backStackEntry ->
                val caseId = backStackEntry.arguments?.getString("caseId")?.toIntOrNull() ?: return@composable
                com.straycare.app.ui.casedetail.CaseDetailScreen(
                    caseId = caseId,
                    onBack = { navController.popBackStack() }
                )
            }
            composable("pet_detail/{petId}") { backStackEntry ->
                val petId = backStackEntry.arguments?.getString("petId")?.toIntOrNull() ?: return@composable
                com.straycare.app.ui.petdetail.PetDetailScreen(
                    petId = petId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
