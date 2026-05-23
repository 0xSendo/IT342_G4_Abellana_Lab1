package com.example.internmatch.ui.student

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.ui.theme.BrandPrimary
import com.example.internmatch.ui.theme.DeepNavySurface
import com.example.internmatch.ui.theme.MidnightBg

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMainScreen(
    user: AuthResponse,
    viewModel: StudentViewModel,
    token: String,
    onLogout: () -> Unit
) {
    var selectedItem by remember { mutableIntStateOf(0) }
    var showNotifications by remember { mutableStateOf(false) }
    val items = listOf("Dashboard", "Community", "Profile")
    val icons = listOf(Icons.Default.Home, Icons.Default.List, Icons.Default.Person)

    LaunchedEffect(Unit) {
        viewModel.fetchData(token)
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { 
                    Text(
                        text = "InternMatch", 
                        color = Color.White, 
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Color.White.copy(alpha = 0.5f))
                    }
                },
                actions = {
                    BadgedBox(
                        badge = {
                            val unreadCount = viewModel.notifications.count { !it.read }
                            if (unreadCount > 0) {
                                Badge { Text(unreadCount.toString()) }
                            }
                        },
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        IconButton(onClick = { showNotifications = true }) {
                            Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = Color.White)
                        }
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MidnightBg,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = DeepNavySurface,
                contentColor = BrandPrimary,
                tonalElevation = 8.dp
            ) {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(icons[index], contentDescription = item) },
                        label = { Text(item) },
                        selected = selectedItem == index,
                        onClick = { selectedItem = index },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = BrandPrimary,
                            selectedTextColor = BrandPrimary,
                            unselectedIconColor = Color.White.copy(alpha = 0.5f),
                            unselectedTextColor = Color.White.copy(alpha = 0.5f),
                            indicatorColor = BrandPrimary.copy(alpha = 0.1f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedItem) {
                0 -> StudentDashboardScreen(user, viewModel, token)
                1 -> CommunityFeedScreen(user, viewModel, token)
                2 -> StudentProfileScreen(user, viewModel)
            }
        }
    }

    if (showNotifications) {
        NotificationCenterDialog(
            notifications = viewModel.notifications,
            onDismiss = { showNotifications = false },
            onMarkRead = { noteId ->
                viewModel.markNotificationRead(token, noteId)
            }
        )
    }
}
