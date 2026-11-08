package vn.tp.radiointelligence.presentation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.presentation.theme.*
import kotlin.math.sin

/**
 * MagicOS 10/11 Radio Wave Harmonic Background
 * Renders subtle, glowing sinusoidal RF carrier waves reflecting active spectrum telemetry.
 */
@Composable
fun MagicOsRadioWaveBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "RadioWaveAnim")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "WavePhase"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MagicRadioWaveGradient)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // Wave 1: Cyan High Frequency Carrier Wave
            val wavePath1 = Path()
            val baseHeight1 = height * 0.22f
            wavePath1.moveTo(0f, baseHeight1)
            var x = 0f
            while (x <= width) {
                val y = baseHeight1 + sin((x / width * 3.5f * Math.PI.toFloat()) + phase) * 28f
                wavePath1.lineTo(x, y)
                x += 10f
            }
            drawPath(
                path = wavePath1,
                color = MagicCyan.copy(alpha = 0.08f),
                style = Stroke(width = 2.5f)
            )

            // Wave 2: Emerald Medium Subcarrier Wave
            val wavePath2 = Path()
            val baseHeight2 = height * 0.55f
            wavePath2.moveTo(0f, baseHeight2)
            x = 0f
            while (x <= width) {
                val y = baseHeight2 + sin((x / width * 2.2f * Math.PI.toFloat()) - phase * 0.8f) * 35f
                wavePath2.lineTo(x, y)
                x += 10f
            }
            drawPath(
                path = wavePath2,
                color = MagicEmerald.copy(alpha = 0.07f),
                style = Stroke(width = 2.5f)
            )

            // Wave 3: Purple Low Frequency RF Envelope
            val wavePath3 = Path()
            val baseHeight3 = height * 0.85f
            wavePath3.moveTo(0f, baseHeight3)
            x = 0f
            while (x <= width) {
                val y = baseHeight3 + sin((x / width * 1.5f * Math.PI.toFloat()) + phase * 0.5f) * 40f
                wavePath3.lineTo(x, y)
                x += 10f
            }
            drawPath(
                path = wavePath3,
                color = MagicPurple.copy(alpha = 0.06f),
                style = Stroke(width = 3f)
            )
        }

        content()
    }
}

/**
 * Signature MagicOS 10/11 Squircle Card (22dp radius with glassmorphic border)
 */
@Composable
fun MagicOsCard(
    modifier: Modifier = Modifier,
    pillColor: Color? = null,
    title: String? = null,
    trailingContent: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MagicCardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, MagicCardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            if (title != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (pillColor != null) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(16.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(pillColor)
                            )
                        }
                        Text(
                            text = title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MagicTextPrimary
                        )
                    }

                    trailingContent?.invoke()
                }
                Spacer(modifier = Modifier.height(14.dp))
            }

            content()
        }
    }
}

/**
 * Magic Capsule Pill (Honor Magic Capsule design pattern)
 */
@Composable
fun MagicCapsulePill(
    text: String,
    accentColor: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val clickableModifier = if (onClick != null) {
        modifier.clickable(onClick = onClick)
    } else {
        modifier
    }

    Surface(
        modifier = clickableModifier.clip(RoundedCornerShape(50)),
        color = accentColor.copy(alpha = 0.12f),
        border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.35f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(accentColor)
            )
            Text(
                text = text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = accentColor
            )
        }
    }
}

/**
 * MagicOS 10/11 Switch Row item with squircle icon badge
 */
@Composable
fun MagicOsSwitchRow(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    description: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    MagicOsCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(13.dp),
                color = iconColor.copy(alpha = 0.14f),
                border = androidx.compose.foundation.BorderStroke(1.dp, iconColor.copy(alpha = 0.25f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MagicTextPrimary
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = description,
                    fontSize = 12.sp,
                    color = MagicTextSecondary,
                    lineHeight = 16.sp
                )
            }

            Switch(
                checked = isChecked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = MagicOsBgDark,
                    checkedTrackColor = iconColor,
                    uncheckedThumbColor = MagicTextSecondary,
                    uncheckedTrackColor = MagicCardBorder
                )
            )
        }
    }
}

/**
 * MagicOS Gradient Button
 */
@Composable
fun MagicOsButton(
    text: String,
    brush: Brush,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    textColor: Color = MagicOsBgDark
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(0.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(brush)
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (icon != null) {
                    Icon(icon, contentDescription = null, tint = textColor, modifier = Modifier.size(18.dp))
                }
                Text(
                    text = text,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = textColor
                )
            }
        }
    }
}

