package com.example.internmatch.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.example.internmatch.ui.theme.AuroraBlue
import com.example.internmatch.ui.theme.AuroraPurple
import com.example.internmatch.ui.theme.DeepSpace

@Composable
fun AuroraBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepSpace)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(AuroraPurple.copy(alpha = 0.15f), Color.Transparent),
                    center = Offset(size.width * 0.2f, size.height * 0.2f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width * 0.2f, size.height * 0.2f),
                radius = size.width * 0.8f
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(AuroraBlue.copy(alpha = 0.15f), Color.Transparent),
                    center = Offset(size.width * 0.8f, size.height * 0.8f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width * 0.8f, size.height * 0.8f),
                radius = size.width * 0.8f
            )
        }
        content()
    }
}
