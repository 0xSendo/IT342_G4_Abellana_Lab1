package com.example.internmatch.ui.student

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
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
import com.example.internmatch.data.model.AuthResponse
import com.example.internmatch.data.model.CommunityPostResponse
import com.example.internmatch.ui.components.AuroraBackground
import com.example.internmatch.ui.theme.*

@Composable
fun CommunityFeedScreen(
    user: AuthResponse,
    viewModel: StudentViewModel,
    token: String
) {
    var showPostDialog by remember { mutableStateOf(false) }

    AuroraBackground {
        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 40.dp, bottom = 100.dp)
            ) {
                item {
                    Text(
                        text = "Community Feed",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(
                        text = "Connect and share with fellow interns.",
                        color = BrandMuted,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 20.dp)
                    )
                }

                if (viewModel.communityPosts.isEmpty()) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            Text(text = "No posts yet. Be the first!", color = BrandMuted)
                        }
                    }
                } else {
                    items(viewModel.communityPosts) { post ->
                        CommunityPostCard(post)
                    }
                }
            }

            FloatingActionButton(
                onClick = { showPostDialog = true },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(24.dp),
                containerColor = BrandPrimary,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Post")
            }
        }
    }

    if (showPostDialog) {
        CreatePostDialog(
            onDismiss = { showPostDialog = false },
            onPost = { content ->
                viewModel.createPost(token, content)
                showPostDialog = false
            }
        )
    }
}

@Composable
fun CommunityPostCard(post: CommunityPostResponse) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(DeepNavySurface)
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(BrandPrimary.copy(alpha = 0.2f))
                        .border(1.dp, BrandPrimary.copy(alpha = 0.3f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = post.studentName.take(1), color = BrandPrimary, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = post.studentName, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text(text = post.studentProgram, color = BrandMuted, fontSize = 11.sp)
                }
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = post.createdAt.split("T").getOrElse(0) { "" },
                    color = BrandMuted,
                    fontSize = 10.sp
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = post.content,
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
            
            if (!post.studentSkills.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    post.studentSkills.split(",").take(3).forEach { skill ->
                        SkillTag(skill.trim())
                    }
                }
            }
        }
    }
}

@Composable
fun CreatePostDialog(onDismiss: () -> Unit, onPost: (String) -> Unit) {
    var content by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Share an Update", color = Color.White) },
        text = {
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                modifier = Modifier.fillMaxWidth().height(150.dp),
                placeholder = { Text("What's on your mind?", color = BrandMuted) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = BrandPrimary,
                    unfocusedBorderColor = GlassBorder
                )
            )
        },
        confirmButton = {
            Button(
                onClick = { if (content.isNotBlank()) onPost(content) },
                colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary)
            ) {
                Text("Post")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = BrandMuted)
            }
        },
        containerColor = DeepNavySurface,
        shape = RoundedCornerShape(24.dp)
    )
}
