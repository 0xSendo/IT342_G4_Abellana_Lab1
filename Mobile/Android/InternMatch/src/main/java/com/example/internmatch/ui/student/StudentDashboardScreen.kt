package com.example.internmatch.ui.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.ui.components.AuroraBackground
import com.example.internmatch.ui.theme.*

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StudentDashboardScreen(
    user: AuthResponse,
    viewModel: StudentViewModel,
    token: String
) {
    LaunchedEffect(Unit) {
        viewModel.fetchData(token)
    }

    AuroraBackground {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(top = 40.dp, bottom = 40.dp)
        ) {
            // Hero Section
            item {
                StudentHero(user, viewModel)
            }

            // Profile Bento
            item {
                ProfileBento(user)
            }

            // Readiness Bento
            item {
                ReadinessBento(user, viewModel.applications.size)
            }

            // Connections Bento
            item {
                ConnectionsBento(viewModel, token)
            }

            // Applications Bento
            item {
                ApplicationsBento(viewModel)
            }
        }
    }
}

@Composable
fun StudentHero(user: AuthResponse, viewModel: StudentViewModel) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(DeepNavySurface.copy(alpha = 0.5f))
            .border(1.dp, GlassBorder, RoundedCornerShape(32.dp))
            .padding(24.dp)
    ) {
        Column {
            Surface(
                color = BrandPrimary.copy(alpha = 0.1f),
                shape = RoundedCornerShape(100.dp),
                border = borderStroke(1.dp, BrandPrimary.copy(alpha = 0.2f))
            ) {
                Text(
                    text = "Student Portal",
                    color = BrandPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Welcome back, ${user.name.split(" ")[0]}! 👋",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Your internship journey starts here.",
                color = BrandMuted,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(24.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SummaryStatGlass(value = viewModel.applications.size.toString(), label = "Total Apps", isPrimary = true)
                SummaryStatGlass(value = viewModel.applications.count { it.status == "PENDING" }.toString(), label = "Pending")
            }
        }
    }
}

@Composable
fun SummaryStatGlass(value: String, label: String, isPrimary: Boolean = false) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isPrimary) BrandPrimary.copy(alpha = 0.1f) else GlassWhite)
            .border(1.dp, if (isPrimary) BrandPrimary.copy(alpha = 0.3f) else GlassBorder, RoundedCornerShape(20.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = value, color = if (isPrimary) BrandPrimary else Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
            Text(text = label, color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ProfileBento(user: AuthResponse) {
    BentoCard {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "Your Identity", color = BrandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Text(text = user.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                IconButton(onClick = { /* Edit profile */ }) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = BrandPrimary)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                MiniMetaItem(label = "Program", value = user.program ?: "Not set")
                MiniMetaItem(label = "Year", value = user.yearLevel ?: "Not set")
            }
            if (!user.bio.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                MiniMetaItem(label = "Bio", value = user.bio)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "Skills & Expertise", color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            
            FlowRow(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                user.skills?.split(",")?.map { it.trim() }?.filter { it.isNotBlank() }?.forEach { skill ->
                    SkillTag(skill)
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            ProfileCompletionBar(calculateCompletion(user))
        }
    }
}

@Composable
fun MiniMetaItem(label: String, value: String) {
    Column {
        Text(text = label, color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(text = value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SkillTag(text: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(BrandPrimary.copy(alpha = 0.1f))
            .border(1.dp, BrandPrimary.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text = text, color = BrandPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ProfileCompletionBar(percentage: Int) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "Profile Completion", color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(text = "$percentage%", color = BrandPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.05f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(percentage / 100f)
                    .fillMaxHeight()
                    .clip(CircleShape)
                    .background(BrandPrimary)
            )
        }
    }
}

@Composable
fun ReadinessBento(user: AuthResponse, appCount: Int) {
    BentoCard {
        Column {
            Text(text = "Checklist", color = BrandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(text = "Career Readiness", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            ReadinessItem(text = "Basic Information", isDone = !user.program.isNullOrBlank())
            ReadinessItem(text = "Add Skills & Expertise", isDone = !user.skills.isNullOrBlank())
            ReadinessItem(text = "First Application Sent", isDone = appCount > 0)
        }
    }
}

@Composable
fun ReadinessItem(text: String, isDone: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (isDone) BrandSecondary.copy(alpha = 0.05f) else Color.White.copy(alpha = 0.02f))
            .border(1.dp, if (isDone) BrandSecondary.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.04f), RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape)
                .background(if (isDone) BrandSecondary else Color.Transparent)
                .border(2.dp, if (isDone) BrandSecondary else Color.White.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Text(text = "✓", color = MidnightBg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = text, color = if (isDone) Color.White else BrandMuted, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun ConnectionsBento(viewModel: StudentViewModel, token: String) {
    BentoCard {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(text = "Networking", color = BrandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Text(text = "My Connections", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                TextButton(onClick = { /* View all */ }) {
                    Text(text = "View All (${viewModel.friends.size})", color = BrandPrimary, fontSize = 12.sp)
                }
            }
            
            if (viewModel.pendingRequests.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "PENDING REQUESTS", color = BrandPrimary, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(top = 8.dp)) {
                    viewModel.pendingRequests.forEach { req ->
                        PendingRequestCard(req) { status ->
                            viewModel.respondToRequest(token, req.id, status)
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            Text(text = "RECENT CONNECTIONS", color = BrandMuted, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            LazyRow(
                modifier = Modifier.padding(top = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (viewModel.friends.isEmpty()) {
                    item {
                        Text(text = "No connections yet.", color = BrandMuted, fontSize = 12.sp, modifier = Modifier.padding(vertical = 10.dp))
                    }
                } else {
                    items(viewModel.friends.take(5)) { friend ->
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(BrandPrimary)
                                .border(2.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = friend.name.take(1), color = Color.White, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PendingRequestCard(req: com.example.internmatch.data.model.ConnectionRequest, onRespond: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White.copy(alpha = 0.03f))
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(text = req.requesterName, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(text = req.requesterRole, color = BrandMuted, fontSize = 11.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = { onRespond("ACCEPTED") },
                modifier = Modifier.height(30.dp),
                contentPadding = PaddingValues(horizontal = 8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text("Accept", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = { onRespond("DECLINED") },
                modifier = Modifier.height(30.dp),
                contentPadding = PaddingValues(horizontal = 8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text("Decline", fontSize = 11.sp, color = BrandMuted)
            }
        }
    }
}

@Composable
fun ApplicationsBento(viewModel: StudentViewModel) {
    BentoCard {
        Column {
            Text(text = "Track", color = BrandPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(text = "My Applications", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            
            if (viewModel.applications.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    Text(text = "No applications found.", color = BrandMuted, fontSize = 14.sp)
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    viewModel.applications.forEach { app ->
                        ApplicationCard(app)
                    }
                }
            }
        }
    }
}

@Composable
fun ApplicationCard(app: com.example.internmatch.data.model.ApplicationResponse) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.02f))
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = app.internshipTitle, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                StatusTag(app.status)
            }
            Text(text = app.company, color = BrandMuted, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = app.appliedAt.split("T")[0], color = BrandMuted, fontSize = 11.sp)
                if (app.status == "PENDING") {
                    Text(text = "Withdraw", color = BrandPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatusTag(status: String) {
    val color = when (status.uppercase()) {
        "ACCEPTED" -> BrandSecondary
        "REJECTED" -> Color.Red
        else -> BrandPrimary
    }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.1f))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(text = status, color = color, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
fun BentoCard(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(DeepNavySurface)
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(24.dp)
    ) {
        content()
    }
}

@Composable
fun borderStroke(width: androidx.compose.ui.unit.Dp, color: Color) = 
    androidx.compose.foundation.BorderStroke(width, color)

fun calculateCompletion(user: AuthResponse): Int {
    val fields = listOf(user.name, user.email, user.program, user.yearLevel, user.skills, user.bio, user.projects)
    val filled = fields.count { !it.isNullOrBlank() }
    return (filled.toFloat() / fields.size * 100).toInt()
}
