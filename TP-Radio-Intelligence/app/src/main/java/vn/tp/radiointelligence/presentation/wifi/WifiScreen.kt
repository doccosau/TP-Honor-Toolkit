package vn.tp.radiointelligence.presentation.wifi

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
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
    val colors = LocalMagicColors.current
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
            pillColor = HonorBlue,
            title = stringResource(R.string.wifi_title),
            trailingContent = {
                MagicCapsulePill(
                    text = if (state.isConnected) "ĐÃ KẾT NỐI" else "CHƯA KẾT NỐI",
                    accentColor = if (state.isConnected) MagicEmerald else colors.textSecondary
                )
            }
        ) {
            Text(stringResource(R.string.wifi_ssid), fontSize = 12.sp, color = colors.textSecondary)
            Text(
                text = state.ssid,
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold,
                color = HonorBlue
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Chuẩn Vô Tuyến:", fontSize = 11.sp, color = colors.textSecondary)
                    Text(state.wifiStandard, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.wifi_channel_width), fontSize = 11.sp, color = colors.textSecondary)
                    Text("${state.channelWidthMhz} MHz", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MagicEmerald)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Tần số sóng:", fontSize = 11.sp, color = colors.textSecondary)
                    Text(
                        text = if (state.frequencyMhz > 0) "${state.frequencyMhz} MHz" else "--",
                        fontSize = 13.sp,
                        color = colors.textPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.wifi_link_speed), fontSize = 11.sp, color = colors.textSecondary)
                    Text(
                        text = if (state.linkSpeedMbps > 0) "${state.linkSpeedMbps} Mbps" else "--",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = HonorBlue
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // MLO Section
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = colors.cardSubtle,
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Đa Liên Kết MLO (Qualcomm FastConnect)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                        MagicCapsulePill(
                            text = if (state.isMloActive) "MLO HOẠT ĐỘNG" else "BĂNG TẦN ĐƠN",
                            accentColor = if (state.isMloActive) MagicEmerald else colors.textSecondary
                        )
                    }

                    if (state.mloAffiliatedLinks.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        state.mloAffiliatedLinks.forEach { linkDesc ->
                            Text(
                                text = "• $linkDesc",
                                fontSize = 11.sp,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(start = 4.dp, top = 2.dp)
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (state.isMloSupported) "Điểm phát Wi-Fi hiện tại đang chạy liên kết đơn. Khi kết nối Router Wi-Fi 7 hỗ trợ MLO, các đường truyền 2.4GHz + 5GHz/6GHz sẽ tự động hiển thị tại đây." else "Phần cứng không kích hoạt MLO đa kênh.",
                            fontSize = 11.sp,
                            color = colors.textSecondary,
                            lineHeight = 15.sp
                        )
                    }
                }
            }
        }

        // Ping Diagnostics Matrix Card
        MagicOsCard(
            pillColor = MagicAmber,
            title = stringResource(R.string.wifi_ping_matrix)
        ) {
            if (state.pingResults.isEmpty()) {
                Text(
                    text = "Chưa có kết quả kiểm tra độ trễ. Nhấn 'Chạy kiểm tra Ping' bên dưới để đo thời gian phản hồi thực tế (Round Trip Time) từ máy tới Gateway, Cloudflare, Google DNS và Viettel DNS.",
                    fontSize = 12.sp,
                    color = colors.textSecondary,
                    lineHeight = 16.sp
                )
            } else {
                state.pingResults.forEach { (host, ms) ->
                    val color = when {
                        ms < 20 -> MagicEmerald
                        ms < 50 -> HonorBlue
                        ms < 100 -> MagicAmber
                        else -> MagicRed
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.cardSubtle)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(host, fontSize = 13.sp, color = colors.textPrimary)
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
            }

            Spacer(modifier = Modifier.height(14.dp))

            MagicOsButton(
                text = stringResource(R.string.wifi_btn_ping),
                brush = MagicBlueGradient,
                onClick = onRunPing,
                icon = Icons.Default.PlayArrow
            )
        }
    }
}
