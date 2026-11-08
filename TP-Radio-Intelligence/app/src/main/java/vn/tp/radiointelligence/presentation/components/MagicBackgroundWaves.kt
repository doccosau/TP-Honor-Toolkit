package vn.tp.radiointelligence.presentation.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import vn.tp.radiointelligence.presentation.theme.HonorBlue
import vn.tp.radiointelligence.presentation.theme.LocalMagicColors
import vn.tp.radiointelligence.presentation.theme.MagicCyan
import kotlin.math.sin

/**
 * MagicOS Telecom RF Wave Motifs.
 * Renders smooth sinusoidal harmonic radio waves in the background to convey RF intelligence.
 */
@Composable
fun MagicBackgroundWaves(modifier: Modifier = Modifier) {
    val colors = LocalMagicColors.current
    val infiniteTransition = rememberInfiniteTransition(label = "WavePhaseTransition")

    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 18000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "WavePhase"
    )

    val alpha1 = if (colors.isDark) 0.06f else 0.035f
    val alpha2 = if (colors.isDark) 0.04f else 0.025f

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // Wave 1: Primary Carrier Wave (Honor Blue)
        val path1 = Path()
        val yBase1 = height * 0.22f
        val amplitude1 = 38f
        val frequency1 = 1.8f * Math.PI.toFloat() / width

        path1.moveTo(0f, yBase1)
        var x = 0f
        while (x <= width) {
            val y = yBase1 + amplitude1 * sin((x * frequency1) + phase)
            path1.lineTo(x, y)
            x += 12f
        }

        drawPath(
            path = path1,
            brush = Brush.horizontalGradient(
                listOf(
                    HonorBlue.copy(alpha = 0f),
                    HonorBlue.copy(alpha = alpha1),
                    MagicCyan.copy(alpha = alpha1),
                    HonorBlue.copy(alpha = 0f)
                )
            ),
            style = Stroke(width = 2.5f)
        )

        // Wave 2: Harmonic Secondary Wave (Magic Cyan)
        val path2 = Path()
        val yBase2 = height * 0.48f
        val amplitude2 = 28f
        val frequency2 = 2.6f * Math.PI.toFloat() / width

        path2.moveTo(0f, yBase2)
        x = 0f
        while (x <= width) {
            val y = yBase2 + amplitude2 * sin((x * frequency2) - (phase * 0.7f))
            path2.lineTo(x, y)
            x += 12f
        }

        drawPath(
            path = path2,
            brush = Brush.horizontalGradient(
                listOf(
                    MagicCyan.copy(alpha = 0f),
                    MagicCyan.copy(alpha = alpha2),
                    HonorBlue.copy(alpha = alpha2),
                    MagicCyan.copy(alpha = 0f)
                )
            ),
            style = Stroke(width = 2.0f)
        )

        // Wave 3: Lower Sub-Band Propagation Wave
        val path3 = Path()
        val yBase3 = height * 0.75f
        val amplitude3 = 45f
        val frequency3 = 1.4f * Math.PI.toFloat() / width

        path3.moveTo(0f, yBase3)
        x = 0f
        while (x <= width) {
            val y = yBase3 + amplitude3 * sin((x * frequency3) + (phase * 0.5f))
            path3.lineTo(x, y)
            x += 14f
        }

        drawPath(
            path = path3,
            brush = Brush.horizontalGradient(
                listOf(
                    HonorBlue.copy(alpha = 0f),
                    HonorBlue.copy(alpha = alpha1),
                    MagicCyan.copy(alpha = alpha1),
                    HonorBlue.copy(alpha = 0f)
                )
            ),
            style = Stroke(width = 3.0f)
        )
    }
}
