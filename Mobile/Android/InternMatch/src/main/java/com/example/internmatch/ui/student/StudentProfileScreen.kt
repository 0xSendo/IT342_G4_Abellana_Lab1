package com.example.internmatch.ui.student

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.ui.components.AuroraBackground
import com.example.internmatch.ui.theme.*

@Composable
fun StudentProfileScreen(
    user: AuthResponse,
    viewModel: StudentViewModel
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Essentials", "Portfolio")

    AuroraBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
        ) {
            Spacer(modifier = Modifier.height(60.dp))
            
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(BrandPrimary.copy(alpha = 0.1f))
                        .border(2.dp, BrandPrimary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = user.name.take(1), color = BrandPrimary, fontSize = 32.sp, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.width(20.dp))
                Column {
                    Text(text = user.name, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Text(text = user.role, color = BrandPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Tab Selector
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.Transparent,
                contentColor = BrandPrimary,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = BrandPrimary
                    )
                },
                divider = {}
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                fontSize = 14.sp,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Tab Content
            when (selectedTab) {
                0 -> EssentialsTab(user)
                1 -> PortfolioTab(user)
            }
        }
    }
}

@Composable
fun EssentialsTab(user: AuthResponse) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            InfoCard(icon = Icons.Default.Email, label = "Email Address", value = user.email)
        }
        item {
            InfoCard(icon = Icons.Default.Info, label = "Academic Program", value = user.program ?: "Not specified")
        }
        item {
            InfoCard(icon = Icons.Default.Star, label = "Year Level", value = user.yearLevel ?: "Not specified")
        }
    }
}

@Composable
fun PortfolioTab(user: AuthResponse) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text(text = "Professional Bio", color = BrandMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            BentoCard {
                Text(
                    text = user.bio ?: "No bio provided yet. Add a professional summary to stand out.",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 14.sp,
                    lineHeight = 22.sp
                )
            }
        }
        
        item {
            Text(text = "Featured Projects", color = BrandMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            BentoCard {
                Text(
                    text = user.projects ?: "No projects listed yet. Showcase your work here.",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 14.sp,
                    lineHeight = 22.sp
                )
            }
        }
        
        item {
            Text(text = "Technical Skills", color = BrandMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                user.skills?.split(",")?.map { it.trim() }?.filter { it.isNotBlank() }?.forEach { skill ->
                    SkillTag(skill)
                } ?: Text(text = "No skills added.", color = BrandMuted, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun InfoCard(icon: ImageVector, label: String, value: String) {
    BentoCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(BrandPrimary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = label, color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(text = value, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
