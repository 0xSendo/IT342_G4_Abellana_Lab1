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
import com.example.internmatch.ui.theme.BrandPrimary
import com.example.internmatch.ui.theme.BrandSecondary
import com.example.internmatch.ui.theme.BrandYellow
import com.example.internmatch.ui.theme.MidnightBg

@Composable
fun AuroraBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MidnightBg)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Top-Left: Coral Glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(BrandPrimary.copy(alpha = 0.12f), Color.Transparent),
                    center = Offset(size.width * 0.12f, size.height * 0.08f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width * 0.12f, size.height * 0.08f),
                radius = size.width * 0.8f
            )
            // Top-Right: Teal Glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(BrandSecondary.copy(alpha = 0.12f), Color.Transparent),
                    center = Offset(size.width * 0.88f, size.height * 0.18f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width * 0.88f, size.height * 0.18f),
                radius = size.width * 0.8f
            )
            // Bottom-Left: Muted Yellow Glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(BrandYellow.copy(alpha = 0.12f), Color.Transparent),
                    center = Offset(size.width * 0.18f, size.height * 0.88f),
                    radius = size.width * 0.8f
                ),
                center = Offset(size.width * 0.18f, size.height * 0.88f),
                radius = size.width * 0.8f
            )
        }
        content()
    }
}
