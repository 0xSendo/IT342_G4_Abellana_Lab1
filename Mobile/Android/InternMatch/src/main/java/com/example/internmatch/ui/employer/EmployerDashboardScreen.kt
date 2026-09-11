package com.example.internmatch.ui.employer

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.internmatch.data.model.ApplicantResponse
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.data.model.InternshipResponse
import com.example.internmatch.ui.components.AuroraBackground
import com.example.internmatch.ui.student.BentoCard
import com.example.internmatch.ui.theme.*

@Composable
fun EmployerDashboardScreen(
    user: AuthResponse,
    viewModel: EmployerViewModel,
    token: String
) {
    AuroraBackground {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(top = 40.dp, bottom = 100.dp)
        ) {
            // Hero Section
            item {
                Column(modifier = Modifier.padding(bottom = 12.dp)) {
                    Text(
                        text = "Employer Portal",
                        color = BrandPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Manage your Talent Pipeline, ${user.name.split(" ")[0]}! 👋",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        lineHeight = 36.sp
                    )
                    Text(
                        text = "Post opportunities and review applicants.",
                        color = BrandMuted,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            // Quick Stats Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    StatGlassCard(
                        label = "Active Jobs",
                        value = viewModel.postings.count { it.status == "ACTIVE" }.toString(),
                        modifier = Modifier.weight(1f),
                        isPrimary = true
                    )
                    StatGlassCard(
                        label = "New Applicants",
                        value = viewModel.applicants.count { it.status == "PENDING" }.toString(),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Company Profile Bento
            item {
                BentoCard {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = "Company Profile", color = BrandMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                Text(text = user.companyName ?: "Your Company", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            }
                            IconButton(onClick = { /* Edit profile */ }) {
                                Icon(Icons.Default.Edit, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(20.dp))
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = user.companyLocation ?: "Location not set", color = Color.White.copy(alpha = 0.7f), fontSize = 13.sp)
                        }
                        if (user.companyWebsite != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Info, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = user.companyWebsite, color = BrandPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // My Postings Section
            item {
                SectionHeader("My Internship Postings", "View All") { /* View all postings */ }
            }

            if (viewModel.postings.isEmpty()) {
                item { EmptyBentoState("No postings yet. Start by creating one!") }
            } else {
                items(viewModel.postings.take(3)) { posting ->
                    PostingCard(posting)
                }
            }

            // Recent Applicants Section
            item {
                SectionHeader("Recent Applicants", "View All") { /* View all applicants */ }
            }

            if (viewModel.applicants.isEmpty()) {
                item { EmptyBentoState("No applicants to show.") }
            } else {
                items(viewModel.applicants.take(3)) { applicant ->
                    ApplicantCard(applicant, onUpdateStatus = { status ->
                        viewModel.updateStatus(token, applicant.id, status)
                    })
                }
            }
        }
    }
}

@Composable
fun StatGlassCard(label: String, value: String, modifier: Modifier = Modifier, isPrimary: Boolean = false) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(if (isPrimary) BrandPrimary.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.03f))
            .border(1.dp, if (isPrimary) BrandPrimary.copy(alpha = 0.2f) else GlassBorder, RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Column {
            Text(text = value, color = if (isPrimary) BrandPrimary else Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Text(text = label, color = BrandMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun SectionHeader(title: String, actionText: String, onAction: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        TextButton(onClick = onAction) {
            Text(text = actionText, color = BrandPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun PostingCard(posting: InternshipResponse) {
    BentoCard {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = posting.title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text(text = "${posting.location} • ${posting.setup}", color = BrandMuted, fontSize = 12.sp)
                }
                StatusTag(posting.status)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Person, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Applicants: ", color = BrandMuted, fontSize = 13.sp)
                Text(text = posting.applicants.toString(), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ApplicantCard(applicant: ApplicantResponse, onUpdateStatus: (String) -> Unit) {
    BentoCard {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = applicant.name, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text(text = "Applying for: ${applicant.internship}", color = BrandMuted, fontSize = 12.sp)
                }
                StatusTag(applicant.status)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { onUpdateStatus("SHORTLISTED") },
                    modifier = Modifier.weight(1f).height(36.dp),
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Shortlist", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { onUpdateStatus("REJECTED") },
                    modifier = Modifier.weight(1f).height(36.dp),
                    contentPadding = PaddingValues(0.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.Red.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Reject", color = Color.Red.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatusTag(status: String) {
    val color = when (status) {
        "ACTIVE", "ACCEPTED" -> Color(0xFF39c6b8)
        "PENDING", "SHORTLISTED" -> BrandPrimary
        else -> Color.Gray
    }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.1f))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text = status, color = color, fontSize = 10.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
fun EmptyBentoState(message: String) {
    BentoCard {
        Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
            Text(text = message, color = BrandMuted, fontSize = 14.sp)
        }
    }
}
