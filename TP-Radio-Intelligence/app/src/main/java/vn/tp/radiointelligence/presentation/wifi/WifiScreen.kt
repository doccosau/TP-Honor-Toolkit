package vn.tp.radiointelligence.presentation.wifi

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.R
import vn.tp.radiointelligence.domain.model.WifiState
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.components.MagicOsButton
import vn.tp.radiointelligence.presentation.components.MagicOsCard
import vn.tp.radiointelligence.presentation.theme.*

@Composable
fun WifiScreen(
    state: WifiState,
    onRunPing: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Wi-Fi 7 & Radio Status Card
        MagicOsCard(
            pillColor = MagicCyan,
            title = stringResource(R.string.wifi_title),
            trailingContent = {
                MagicCapsulePill(
                    text = if (state.isConnected) "ĐÃ KẾT NỐI" else "CHƯA KẾT NỐI",
                    accentColor = if (state.isConnected) MagicEmerald else MagicTextSecondary
                )
            }
        ) {
            Text(stringResource(R.string.wifi_ssid), fontSize = 12.sp, color = MagicTextSecondary)
            Text(
                text = state.ssid,
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold,
                color = MagicCyan
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Chuẩn Vô Tuyến:", fontSize = 11.sp, color = MagicTextSecondary)
                    Text(state.wifiStandard, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = MagicTextPrimary)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.wifi_channel_width), fontSize = 11.sp, color = MagicTextSecondary)
                    Text("${state.channelWidthMhz} MHz", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MagicEmerald)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Tần số sóng:", fontSize = 11.sp, color = MagicTextSecondary)
                    Text("${state.frequencyMhz} MHz", fontSize = 13.sp, color = MagicTextPrimary, fontFamily = FontFamily.Monospace)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.wifi_link_speed), fontSize = 11.sp, color = MagicTextSecondary)
                    Text("${state.linkSpeedMbps} Mbps", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MagicCyan)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // MLO Section
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MagicCardSubtle,
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MagicCardBorder)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Đa Liên Kết MLO (FastConnect 7800)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MagicTextPrimary
                        )
                        MagicCapsulePill(
                            text = if (state.isMloActive) "MLO KÍCH HOẠT" else "BĂNG TẦN ĐƠN",
                            accentColor = if (state.isMloActive) MagicEmerald else MagicTextSecondary
                        )
                    }

                    if (state.mloAffiliatedLinks.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        state.mloAffiliatedLinks.forEach { linkDesc ->
                            Text(
                                text = "• $linkDesc",
                                fontSize = 11.sp,
                                color = MagicTextSecondary,
                                modifier = Modifier.padding(start = 4.dp, top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // Ping Diagnostics Matrix Card
        MagicOsCard(
            pillColor = MagicAmber,
            title = stringResource(R.string.wifi_ping_matrix)
        ) {
            val pingItems = if (state.pingResults.isNotEmpty()) {
                state.pingResults.toList()
            } else {
                listOf(
                    "Gateway Router" to 3,
                    "Cloudflare (1.1.1.1)" to 14,
                    "Google DNS (8.8.8.8)" to 18,
                    "Viettel DNS" to 7
                )
            }

            pingItems.forEach { (host, ms) ->
                val color = when {
                    ms < 20 -> MagicEmerald
                    ms < 50 -> MagicCyan
                    ms < 100 -> MagicAmber
                    else -> MagicRed
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MagicCardSubtle)
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(host, fontSize = 13.sp, color = MagicTextPrimary)
                    Text(
                        text = if (ms >= 999) "Mất gói" else "$ms ms",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = color,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
            }

            Spacer(modifier = Modifier.height(10.dp))

            MagicOsButton(
                text = stringResource(R.string.wifi_btn_ping),
                brush = MagicCyanGradient,
                onClick = onRunPing,
                icon = Icons.Default.PlayArrow
            )
        }
    }
}
