package vn.tp.radiointelligence.presentation.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.domain.model.SimSlotInfo
import vn.tp.radiointelligence.presentation.theme.*

/**
 * MagicOS 10/11 Grouped Inset Card
 * Pure Porcelain White in Light mode, Obsidian Slate in Dark mode.
 */
@Composable
fun MagicOsCard(
    modifier: Modifier = Modifier,
    pillColor: Color? = null,
    title: String? = null,
    trailingContent: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val colors = LocalMagicColors.current

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = colors.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = if (colors.isDark) 0.dp else 1.5.dp)
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
                                    .width(3.5.dp)
                                    .height(16.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(pillColor)
                            )
                        }
                        Text(
                            text = title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
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
 * Intelligent Smart SIM Card Widget
 * Dynamically displays carrier name, signal level bars (0..4), MCC-MNC, data active status, and dBm.
 */
@Composable
fun SmartSimCard(
    slot: SimSlotInfo,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalMagicColors.current
    val accentColor = if (isSelected) HonorBlue else colors.cardBorder

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onClick),
        color = if (isSelected) HonorBlue.copy(alpha = if (colors.isDark) 0.12f else 0.08f) else colors.cardSubtle,
        border = androidx.compose.foundation.BorderStroke(
            if (isSelected) 1.5.dp else 1.dp,
            if (isSelected) HonorBlue else colors.cardBorder
        ),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.Default.SimCard,
                        contentDescription = null,
                        tint = if (isSelected) HonorBlue else colors.textSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "SIM ${slot.slotIndex + 1}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) HonorBlue else colors.textSecondary
                    )
                }

                if (slot.isDataActive) {
                    Surface(
                        color = MagicEmerald.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "DATA",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = MagicEmerald,
                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = slot.carrierName,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Signal Bars (0..4)
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.Bottom) {
                    for (bar in 1..4) {
                        val barHeight = 4.dp + (bar * 2.5).dp
                        val isFilled = bar <= slot.signalLevel
                        val barColor = if (isFilled) {
                            if (isSelected) HonorBlue else colors.textPrimary
                        } else {
                            colors.cardBorder
                        }
                        Box(
                            modifier = Modifier
                                .width(3.dp)
                                .height(barHeight)
                                .clip(RoundedCornerShape(1.dp))
                                .background(barColor)
                        )
                    }
                }

                Text(
                    text = if (slot.signalDbm in -140..-44) "${slot.signalDbm} dBm" else "-- dBm",
                    fontSize = 11.sp,
                    color = colors.textSecondary,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

/**
 * Professional Circular Arc Signal Gauge
 * Maps RSRP dBm (-140 dBm to -44 dBm) into a smooth 270° semi-circular gauge.
 */
@Composable
fun SignalStrengthArcGauge(
    rsrpDbm: Int,
    rsrqDb: Int,
    sinrDb: Int,
    bandName: String,
    modifier: Modifier = Modifier
) {
    val colors = LocalMagicColors.current

    // Normalize RSRP: -140 dBm (0.0) to -44 dBm (1.0)
    val targetFraction = ((rsrpDbm - (-140f)) / ((-44f) - (-140f))).coerceIn(0f, 1f)
    val animatedFraction by animateFloatAsState(
        targetValue = targetFraction,
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "ArcGaugeAnim"
    )

    val (qualityText, qualityColor) = when {
        rsrpDbm >= -85 -> "RẤT TỐT" to MagicEmerald
        rsrpDbm >= -100 -> "TỐT / KHÁ" to HonorBlue
        rsrpDbm >= -115 -> "TRUNG BÌNH" to MagicAmber
        else -> "YẾU / RỚT SÓNG" to MagicRed
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(200.dp)
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val strokeWidth = 14.dp.toPx()
                val diameter = size.minDimension - strokeWidth
                val topLeft = Offset(strokeWidth / 2f, strokeWidth / 2f)
                val arcSize = Size(diameter, diameter)

                // Background Track: 240° sweep starting at 150°
                drawArc(
                    color = colors.cardSubtle,
                    startAngle = 150f,
                    sweepAngle = 240f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )

                // Active Progress Arc
                drawArc(
                    brush = Brush.sweepGradient(
                        0.0f to MagicRed,
                        0.25f to MagicAmber,
                        0.6f to HonorBlue,
                        0.85f to MagicEmerald,
                        1.0f to MagicEmerald
                    ),
                    startAngle = 150f,
                    sweepAngle = 240f * animatedFraction,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "$rsrpDbm",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "dBm (RSRP)",
                    fontSize = 11.sp,
                    color = colors.textSecondary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    color = qualityColor.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(50)
                ) {
                    Text(
                        text = qualityText,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = qualityColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Sub-Metrics Bar (RSRQ, SINR, Band)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(colors.cardSubtle)
                .padding(vertical = 10.dp, horizontal = 14.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("RSRQ", fontSize = 10.sp, color = colors.textSecondary)
                Text("$rsrqDb dB", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary, fontFamily = FontFamily.Monospace)
            }
            Box(modifier = Modifier.width(1.dp).height(24.dp).background(colors.cardBorder))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("SINR", fontSize = 10.sp, color = colors.textSecondary)
                Text("$sinrDb dB", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary, fontFamily = FontFamily.Monospace)
            }
            Box(modifier = Modifier.width(1.dp).height(24.dp).background(colors.cardBorder))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Băng Tần", fontSize = 10.sp, color = colors.textSecondary)
                Text(
                    text = bandName,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = HonorBlue,
                    maxLines = 1
                )
            }
        }
    }
}

/**
 * Intelligent Recommendation Banner
 */
@Composable
fun RecommendationBanner(reason: String, modifier: Modifier = Modifier) {
    val colors = LocalMagicColors.current

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = HonorBlue.copy(alpha = if (colors.isDark) 0.12f else 0.08f),
        border = androidx.compose.foundation.BorderStroke(1.dp, HonorBlue.copy(alpha = 0.25f))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                Icons.Default.Lightbulb,
                contentDescription = null,
                tint = HonorBlue,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = reason,
                fontSize = 12.sp,
                color = colors.textPrimary,
                lineHeight = 16.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

/**
 * Magic Capsule Pill
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
                color = accentColor,
                maxLines = 1,
                softWrap = false
            )
        }
    }
}

/**
 * MagicOS Switch Row
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
    val colors = LocalMagicColors.current

    MagicOsCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                modifier = Modifier.size(42.dp),
                shape = RoundedCornerShape(12.dp),
                color = iconColor.copy(alpha = 0.12f),
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
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = description,
                    fontSize = 12.sp,
                    color = colors.textSecondary,
                    lineHeight = 16.sp
                )
            }

            Switch(
                checked = isChecked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = HonorBlue,
                    uncheckedThumbColor = colors.textSecondary,
                    uncheckedTrackColor = colors.cardBorder
                )
            )
        }
    }
}

/**
 * MagicOS Button
 */
@Composable
fun MagicOsButton(
    text: String,
    brush: Brush,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    textColor: Color = Color.White
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(46.dp),
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
