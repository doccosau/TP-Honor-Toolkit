package vn.tp.radiointelligence.presentation.cellular

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import vn.tp.radiointelligence.domain.model.CellularState
import vn.tp.radiointelligence.domain.model.NetworkModeLock
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.components.MagicOsButton
import vn.tp.radiointelligence.presentation.components.MagicOsCard
import vn.tp.radiointelligence.presentation.components.RecommendationBanner
import vn.tp.radiointelligence.presentation.components.SignalStrengthArcGauge
import vn.tp.radiointelligence.presentation.components.SmartSimCard
import vn.tp.radiointelligence.presentation.theme.*

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CellularScreen(
    state: CellularState,
    onSelectSlot: (Int) -> Unit,
    onSetLockMode: (NetworkModeLock) -> Unit,
    onRestartRadio: () -> Unit,
    onLaunchNativeRadioInfo: () -> Unit,
    onUpdateSmsc: (String) -> Unit,
    onReadSmscFromSim: () -> Unit
) {
    val colors = LocalMagicColors.current
    val scrollState = rememberScrollState()
    val currentSlot = state.slots.getOrNull(state.selectedSlotIndex)
    var inputSmsc by remember(state.smscNumber) { mutableStateOf(state.smscNumber) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Dual SIM Selector (Zero Hardcoded - Reads Live from SIM UICC)
        if (state.slots.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                state.slots.forEach { slot ->
                    SmartSimCard(
                        slot = slot,
                        isSelected = slot.slotIndex == state.selectedSlotIndex,
                        onClick = { onSelectSlot(slot.slotIndex) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // RF Signal Arc Gauge (Real Hardware Telemetry Measurement)
        state.btsInfo?.let { bts ->
            MagicOsCard(
                pillColor = MagicEmerald,
                title = "Đo Đạc Vô Tuyến Trạm BTS",
                trailingContent = {
                    MagicCapsulePill(
                        text = if (bts.isCarrierAggregation) "CA Gộp Sóng (4G+/5G+)" else "Băng Tần Đơn",
                        accentColor = if (bts.isCarrierAggregation) MagicEmerald else colors.textSecondary
                    )
                }
            ) {
                SignalStrengthArcGauge(
                    rsrpDbm = bts.rsrp,
                    rsrqDb = bts.rsrq,
                    sinrDb = bts.sinr,
                    bandName = bts.bandName
                )

                if (bts.timingAdvance > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Khoảng cách ước tính tới trạm:", fontSize = 12.sp, color = colors.textSecondary)
                        Text(
                            text = "~${String.format("%.1f", bts.distanceMeters)} m (TA: ${bts.timingAdvance})",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                if (bts.secondaryBands.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Băng tần phụ đang gộp (Carrier Aggregation):", fontSize = 12.sp, color = colors.textSecondary)
                    Spacer(modifier = Modifier.height(6.dp))
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        bts.secondaryBands.forEach { secBand ->
                            MagicCapsulePill(text = secBand, accentColor = HonorBlue)
                        }
                    }
                }
            }
        } ?: run {
            MagicOsCard(
                pillColor = MagicAmber,
                title = "Tín Hiệu Trạm Phát Vô Tuyến"
            ) {
                Text(
                    text = "Đang quét tín hiệu vô tuyến từ thẻ SIM đang chọn... Đảm bảo quyền Vị trí (ACCESS_FINE_LOCATION) đã được cấp và SIM đang có kết nối mạng di động.",
                    fontSize = 12.sp,
                    color = colors.textSecondary,
                    lineHeight = 16.sp
                )
            }
        }

        // Intelligent RF Recommendation Banner
        if (state.smartRecommendationReason.isNotBlank()) {
            RecommendationBanner(reason = state.smartRecommendationReason)
        }

        // Intelligent Network Mode Lock Card
        MagicOsCard(
            pillColor = HonorBlue,
            title = stringResource(R.string.cellular_lock_mode),
            trailingContent = {
                MagicCapsulePill(
                    text = state.currentNetworkType,
                    accentColor = HonorBlue
                )
            }
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                NetworkModeLock.entries.forEach { mode ->
                    val isChecked = state.currentPreferredMode == mode
                    val (title, subDesc, tagText, tagColor) = when (mode) {
                        NetworkModeLock.MODE_5G_ONLY -> {
                            val tag = if (state.is5gAvailableInArea) "Có sóng 5G" else "Cần trạm 5G SA"
                            val tagClr = if (state.is5gAvailableInArea) MagicEmerald else MagicAmber
                            Quad(stringResource(R.string.mode_5g_only), "Khóa modem chỉ bắt trạm 5G Standalone SA, bypass hoàn toàn 4G", tag, tagClr)
                        }
                        NetworkModeLock.MODE_4G_ONLY -> {
                            Quad(stringResource(R.string.mode_4g_only), "Giữ ping phẳng tuyệt đối, loại trừ hoàn toàn rớt về 3G/2G", "Ping phẳng", HonorBlue)
                        }
                        NetworkModeLock.MODE_NR_LTE -> {
                            Quad(stringResource(R.string.mode_nr_lte), "Cắt hẳn 2G/3G để phòng thủ chống trạm BTS giả 2G mạo danh", "Bảo mật", MagicEmerald)
                        }
                        NetworkModeLock.MODE_AUTO -> {
                            Quad(stringResource(R.string.mode_auto), "Theo cấu hình mặc định của hệ điều hành MagicOS và nhà mạng", "Mặc định", colors.textSecondary)
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable { onSetLockMode(mode) },
                        color = if (isChecked) HonorBlue.copy(alpha = if (colors.isDark) 0.12f else 0.08f) else colors.cardSubtle,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isChecked) HonorBlue else Color.Transparent
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isChecked,
                                onClick = { onSetLockMode(mode) },
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = HonorBlue,
                                    unselectedColor = colors.textTertiary
                                )
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = title,
                                        fontSize = 14.sp,
                                        fontWeight = if (isChecked) FontWeight.Bold else FontWeight.Medium,
                                        color = if (isChecked) HonorBlue else colors.textPrimary,
                                        modifier = Modifier.weight(1f, fill = false)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    MagicCapsulePill(text = tagText, accentColor = tagColor)
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = subDesc,
                                    fontSize = 11.sp,
                                    color = colors.textSecondary,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        MagicOsButton(
                            text = "Reset Radio (2s)",
                            brush = Brush.horizontalGradient(listOf(colors.cardSubtle, colors.cardSubtle)),
                            onClick = onRestartRadio,
                            icon = Icons.Default.Refresh,
                            textColor = HonorBlue
                        )
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        MagicOsButton(
                            text = "Menu 4636 Gốc",
                            brush = Brush.horizontalGradient(listOf(colors.cardSubtle, colors.cardSubtle)),
                            onClick = onLaunchNativeRadioInfo,
                            icon = Icons.AutoMirrored.Filled.OpenInNew,
                            textColor = MagicEmerald
                        )
                    }
                }
            }
        }

        // Live SIM SMSC Controller Card (Zero Hardcoded - Direct Hardware RIL Access)
        MagicOsCard(
            pillColor = MagicAmber,
            title = stringResource(R.string.smsc_title),
            trailingContent = {
                currentSlot?.carrierName?.takeIf { it.isNotBlank() }?.let { name ->
                    MagicCapsulePill(
                        text = name,
                        accentColor = MagicAmber
                    )
                }
            }
        ) {
            Text(
                text = "Đọc và cập nhật trực tiếp số Trung Tâm Tin Nhắn (SMSC) được lưu trên thẻ SIM qua RIL để khắc phục lỗi không gửi được tin nhắn (SMS Error 38/28) trên máy Honor Magic.",
                fontSize = 12.sp,
                color = colors.textSecondary,
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = inputSmsc,
                onValueChange = { inputSmsc = it },
                label = { Text("Số SMSC (+84...)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = HonorBlue,
                    unfocusedBorderColor = colors.cardBorder,
                    focusedLabelColor = HonorBlue,
                    unfocusedLabelColor = colors.textSecondary,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                    focusedContainerColor = colors.cardSubtle,
                    unfocusedContainerColor = colors.cardSubtle
                ),
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontFamily = FontFamily.Monospace,
                    fontSize = 15.sp
                )
            )

            // Live status read from SIM chip
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Đang lưu trên SIM:",
                    fontSize = 12.sp,
                    color = colors.textSecondary
                )
                Text(
                    text = currentSlot?.currentSmscOnSim?.ifBlank { "(Chưa đọc được)" } ?: "(Chưa đọc được)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (!currentSlot?.currentSmscOnSim.isNullOrBlank()) MagicEmerald else colors.textTertiary,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(modifier = Modifier.weight(1f)) {
                    MagicOsButton(
                        text = "Đọc lại từ SIM",
                        brush = Brush.horizontalGradient(listOf(colors.cardSubtle, colors.cardSubtle)),
                        onClick = onReadSmscFromSim,
                        icon = Icons.Default.Download,
                        textColor = HonorBlue
                    )
                }
                Box(modifier = Modifier.weight(1f)) {
                    MagicOsButton(
                        text = stringResource(R.string.smsc_btn_update),
                        brush = MagicBlueGradient,
                        onClick = { onUpdateSmsc(inputSmsc) },
                        icon = Icons.AutoMirrored.Filled.Send
                    )
                }
            }
        }
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
