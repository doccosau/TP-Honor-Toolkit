package vn.tp.radiointelligence.presentation.gnss

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.R
import vn.tp.radiointelligence.domain.model.GnssState
import vn.tp.radiointelligence.domain.model.SatelliteInfo
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.components.MagicOsButton
import vn.tp.radiointelligence.presentation.components.MagicOsCard
import vn.tp.radiointelligence.presentation.theme.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun GnssScreen(
    state: GnssState,
    onAccelerateGps: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1-Tap Fast GPS Accelerator Card
        MagicOsCard(
            pillColor = MagicEmerald,
            title = stringResource(R.string.gnss_fast_lock),
            trailingContent = {
                MagicCapsulePill(
                    text = "A-GPS Fix 2s",
                    accentColor = MagicEmerald
                )
            }
        ) {
            Text(
                text = stringResource(R.string.gnss_fast_lock_desc),
                fontSize = 12.sp,
                color = MagicTextSecondary,
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(14.dp))
            MagicOsButton(
                text = stringResource(R.string.gnss_btn_accelerate),
                brush = MagicEmeraldGradient,
                onClick = onAccelerateGps,
                icon = Icons.Default.Bolt
            )
        }

        // GNSS Telemetry & Fix Status
        MagicOsCard(
            pillColor = MagicCyan,
            title = "Định Vị Vệ Tinh GNSS",
            trailingContent = {
                MagicCapsulePill(
                    text = if (state.isFixAcquired) "3D FIX KHÓA CHẶT" else "ĐANG TÌM VỆ TINH",
                    accentColor = if (state.isFixAcquired) MagicEmerald else MagicAmber
                )
            }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Tọa độ GNSS:", fontSize = 11.sp, color = MagicTextSecondary)
                    Text(
                        text = "${String.format("%.5f", state.latitude)}, ${String.format("%.5f", state.longitude)}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MagicTextPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.gnss_accuracy), fontSize = 11.sp, color = MagicTextSecondary)
                    Text(
                        text = "±${String.format("%.1f", state.accuracyMeters)} m",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (state.accuracyMeters <= 2.5f) MagicEmerald else MagicCyan,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Constellation Summary Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MagicCapsulePill(text = "Bắc Đẩu: ${state.beidouCount}", accentColor = MagicEmerald)
                MagicCapsulePill(text = "GPS: ${state.gpsCount}", accentColor = MagicCyan)
                MagicCapsulePill(text = "L1+L5 Kép: ${state.dualFreqCount}", accentColor = MagicAmber)
            }
        }

        // SkyView 2D Polar Radar
        MagicOsCard(
            pillColor = MagicCyan,
            title = stringResource(R.string.gnss_radar_title),
            trailingContent = {
                Text(
                    text = "${state.usedSatellites}/${state.totalSatellites} vệ tinh",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MagicCyan
                )
            }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(260.dp)
                        .clip(RoundedCornerShape(130.dp))
                        .background(Color(0xFF0D1322)),
                    contentAlignment = Alignment.Center
                ) {
                    GnssSkyViewCanvas(satellites = state.satellites)
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Legend
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    LegendItem("BeiDou", MagicEmerald)
                    LegendItem("GPS", MagicCyan)
                    LegendItem("Galileo", MagicAmber)
                    LegendItem("GLONASS", MagicRed)
                }
            }
        }

        // Satellite List Table
        MagicOsCard(
            pillColor = MagicAmber,
            title = "Bảng Tín Hiệu Vệ Tinh (C/N0 SNR)"
        ) {
            state.satellites.forEach { sat ->
                SatelliteRow(sat)
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

@Composable
fun LegendItem(name: String, color: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(color)
        )
        Text(name, fontSize = 11.sp, color = MagicTextSecondary)
    }
}

@Composable
fun GnssSkyViewCanvas(satellites: List<SatelliteInfo>) {
    Canvas(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f
        val radius = size.minDimension / 2f

        // Concentric Circles: 0°, 30°, 60°
        drawCircle(color = MagicCardBorder, radius = radius, center = Offset(centerX, centerY), style = Stroke(width = 1.5f))
        drawCircle(color = MagicCardBorder, radius = radius * 0.66f, center = Offset(centerX, centerY), style = Stroke(width = 1f))
        drawCircle(color = MagicCardBorder, radius = radius * 0.33f, center = Offset(centerX, centerY), style = Stroke(width = 1f))

        // Crosshairs (N-S, E-W)
        drawLine(color = MagicCardBorder, start = Offset(centerX, centerY - radius), end = Offset(centerX, centerY + radius), strokeWidth = 1f)
        drawLine(color = MagicCardBorder, start = Offset(centerX - radius, centerY), end = Offset(centerX + radius, centerY), strokeWidth = 1f)

        // Plot Satellites
        for (sat in satellites) {
            val r = radius * ((90f - sat.elevationDegrees.coerceIn(0f, 90f)) / 90f)
            val rad = Math.toRadians((sat.azimuthDegrees - 90.0)).toFloat()
            val satX = centerX + r * cos(rad)
            val satY = centerY + r * sin(rad)

            val color = when (sat.constellation) {
                "BeiDou" -> MagicEmerald
                "GPS" -> MagicCyan
                "Galileo" -> MagicAmber
                else -> MagicRed
            }

            // Halo for dual frequency L1+L5
            if (sat.isDualFrequency) {
                drawCircle(color = color.copy(alpha = 0.35f), radius = 9f, center = Offset(satX, satY))
            }

            // Core dot
            drawCircle(
                color = if (sat.usedInFix) color else color.copy(alpha = 0.4f),
                radius = if (sat.usedInFix) 5f else 3.5f,
                center = Offset(satX, satY)
            )
        }
    }
}

@Composable
fun SatelliteRow(sat: SatelliteInfo) {
    val satColor = when (sat.constellation) {
        "BeiDou" -> MagicEmerald
        "GPS" -> MagicCyan
        "Galileo" -> MagicAmber
        else -> MagicRed
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(MagicCardSubtle)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (sat.usedInFix) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MagicEmerald, modifier = Modifier.size(14.dp))
        } else {
            Box(modifier = Modifier.size(14.dp))
        }

        Text(
            text = "${sat.constellation} #${sat.svid}",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = satColor,
            modifier = Modifier.width(100.dp)
        )

        // SNR Bar
        val progress = (sat.cn0DbHz / 50f).coerceIn(0f, 1f)
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .weight(1f)
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = satColor,
            trackColor = MagicCardBorder
        )

        Text(
            text = "${String.format("%.1f", sat.cn0DbHz)} dB-Hz",
            fontSize = 11.sp,
            color = MagicTextPrimary,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.width(65.dp)
        )

        if (sat.isDualFrequency) {
            MagicCapsulePill(text = "L5/B2a", accentColor = MagicAmber)
        }
    }
}
