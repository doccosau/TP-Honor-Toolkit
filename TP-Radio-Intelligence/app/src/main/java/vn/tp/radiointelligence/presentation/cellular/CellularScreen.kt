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
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
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

@Composable
fun CellularScreen(
    state: CellularState,
    onSelectSlot: (Int) -> Unit,
    onSetLockMode: (NetworkModeLock) -> Unit,
    onRestartRadio: () -> Unit,
    onLaunchNativeRadioInfo: () -> Unit,
    onUpdateSmsc: (String) -> Unit
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
        // Dual SIM Selector (Dynamic & Zero Hardcoded)
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

        // RF Signal Arc Gauge (Real Hardware Measurement)
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
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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
                    text = "Đang nhận diện sóng vô tuyến từ thẻ SIM đang chọn... Đảm bảo quyền Vị trí (ACCESS_FINE_LOCATION) đã được cấp và SIM đang có kết nối mạng.",
                    fontSize = 12.sp,
                    color = colors.textSecondary,
                    lineHeight = 16.sp
                )
            }
        }

        // Intelligent Recommendation Banner
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
                    val (title, subDesc) = when (mode) {
                        NetworkModeLock.MODE_5G_ONLY -> stringResource(R.string.mode_5g_only) to "Khóa cứng sóng 5G Standalone SA, tốc độ cao nhất"
                        NetworkModeLock.MODE_4G_ONLY -> stringResource(R.string.mode_4g_only) to "Giữ ping phẳng tuyệt đối, loại trừ hoàn toàn rớt về 3G/2G"
                        NetworkModeLock.MODE_NR_LTE -> stringResource(R.string.mode_nr_lte) to "Bỏ hẳn 2G/3G để phòng thủ chống trạm BTS giả mạo"
                        NetworkModeLock.MODE_AUTO -> stringResource(R.string.mode_auto) to "Theo cấu hình mặc định của nhà mạng và hệ điều hành"
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
                            Column {
                                Text(
                                    text = title,
                                    fontSize = 14.sp,
                                    fontWeight = if (isChecked) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isChecked) HonorBlue else colors.textPrimary
                                )
                                Text(
                                    text = subDesc,
                                    fontSize = 11.sp,
                                    color = colors.textSecondary
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

        // Dynamic SMSC Controller Card (Zero Hardcoded)
        MagicOsCard(
            pillColor = MagicAmber,
            title = stringResource(R.string.smsc_title),
            trailingContent = {
                currentSlot?.carrierDetails?.let { carrier ->
                    MagicCapsulePill(
                        text = carrier.operatorName,
                        accentColor = MagicAmber
                    )
                }
            }
        ) {
            Text(
                text = "Tự động nhận diện nhà mạng của SIM đang chọn để hỗ trợ sửa lỗi SMS Error 38/28 do máy Honor nội địa nhận sai đầu số trung tâm.",
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

            // Dynamic Recommendation for the Active SIM
            currentSlot?.recommendedSmsc?.takeIf { it.isNotBlank() }?.let { autoSmsc ->
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Số khuyến nghị cho ${currentSlot.carrierName}:",
                        fontSize = 12.sp,
                        color = colors.textSecondary
                    )
                    TextButton(onClick = { inputSmsc = autoSmsc }) {
                        Text(
                            text = "Nạp $autoSmsc",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = HonorBlue
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            MagicOsButton(
                text = stringResource(R.string.smsc_btn_update),
                brush = MagicBlueGradient,
                onClick = { onUpdateSmsc(inputSmsc) },
                icon = Icons.AutoMirrored.Filled.Send
            )
        }
    }
}
