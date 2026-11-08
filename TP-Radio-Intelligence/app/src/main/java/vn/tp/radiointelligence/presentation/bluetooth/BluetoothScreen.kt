package vn.tp.radiointelligence.presentation.bluetooth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.R
import vn.tp.radiointelligence.domain.model.BluetoothState
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.components.MagicOsButton
import vn.tp.radiointelligence.presentation.components.MagicOsCard
import vn.tp.radiointelligence.presentation.theme.*

@Composable
fun BluetoothScreen(
    state: BluetoothState,
    onToggleScan: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Audio Codec Inspector Card
        MagicOsCard(
            pillColor = MagicPurple,
            title = stringResource(R.string.bt_title),
            trailingContent = {
                MagicCapsulePill(
                    text = "Honor Hi-Res Audio",
                    accentColor = MagicPurple
                )
            }
        ) {
            Text(
                text = state.activeDeviceName ?: "Honor Earbuds 3 Pro (Đang ghép nối)",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = MagicTextPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(stringResource(R.string.bt_codec_active), fontSize = 12.sp, color = MagicTextSecondary)
            Text(
                text = state.activeCodecName,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MagicEmerald
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(stringResource(R.string.bt_sample_rate), fontSize = 11.sp, color = MagicTextSecondary)
                    Text("${state.sampleRateKhz} kHz", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = MagicCyan)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.bt_bit_depth), fontSize = 11.sp, color = MagicTextSecondary)
                    Text("${state.bitDepth} bit Hi-Res", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MagicAmber)
                }
            }
        }

        // BLE Proximity Radar Card
        MagicOsCard(
            pillColor = MagicEmerald,
            title = "BLE Proximity Radar (Quét Sóng Cự Ly Gần)",
            trailingContent = {
                MagicCapsulePill(
                    text = if (state.isScanning) "ĐANG QUÉT RADAR" else "RADAR SẴN SÀNG",
                    accentColor = if (state.isScanning) MagicEmerald else MagicTextSecondary
                )
            }
        ) {
            if (state.scannedDevices.isEmpty()) {
                Text(
                    text = "Nhấn nút bên dưới để quét toàn bộ thiết bị phát sóng BLE (AirTag, SmartTag, đồng hồ, tai nghe) xung quanh và ước lượng khoảng cách.",
                    fontSize = 12.sp,
                    color = MagicTextSecondary,
                    lineHeight = 16.sp
                )
            } else {
                state.scannedDevices.forEach { dev ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MagicCardSubtle)
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = dev.name,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (dev.name.contains("AirTag", ignoreCase = true)) MagicRed else MagicTextPrimary
                            )
                            Text(
                                text = dev.address,
                                fontSize = 10.sp,
                                color = MagicTextSecondary,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "~${dev.estimatedDistanceMeters} m",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (dev.estimatedDistanceMeters < 2.0) MagicEmerald else MagicCyan,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "${dev.rssi} dBm",
                                fontSize = 10.sp,
                                color = MagicTextSecondary,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            MagicOsButton(
                text = if (state.isScanning) stringResource(R.string.bt_radar_stop) else stringResource(R.string.bt_radar_scan),
                brush = if (state.isScanning) Brush.horizontalGradient(listOf(Color(0xFFD32F2F), MagicRed)) else MagicEmeraldGradient,
                onClick = onToggleScan,
                icon = Icons.Default.Radar
            )
        }
    }
}
