package vn.tp.radiointelligence.presentation.cellular

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CellTower
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
    val scrollState = rememberScrollState()
    var inputSmsc by remember(state.smscNumber) { mutableStateOf(state.smscNumber) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Dual SIM Selector (MagicOS 10/11 Capsule Style)
        if (state.slots.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                state.slots.forEach { slot ->
                    val isSelected = slot.slotIndex == state.selectedSlotIndex
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(18.dp))
                            .clickable { onSelectSlot(slot.slotIndex) },
                        color = if (isSelected) MagicCyan.copy(alpha = 0.14f) else MagicCardBg,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) MagicCyan else MagicCardBorder
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                modifier = Modifier.size(36.dp),
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSelected) MagicCyan.copy(alpha = 0.2f) else MagicCardSubtle
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        Icons.Default.SimCard,
                                        contentDescription = null,
                                        tint = if (isSelected) MagicCyan else MagicTextSecondary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = slot.displayName,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) MagicCyan else MagicTextPrimary
                                )
                                Text(
                                    text = slot.carrierName,
                                    fontSize = 11.sp,
                                    color = MagicTextSecondary,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }

        // Active Radio Mode Card
        MagicOsCard(
            pillColor = MagicEmerald,
            title = "Trạng Thái Băng Tần Di Động",
            trailingContent = {
                MagicCapsulePill(
                    text = state.currentNetworkType,
                    accentColor = MagicEmerald
                )
            }
        ) {
            Text(
                text = "Modem đang kết nối trực tiếp với trạm vô tuyến di động. Băng tần và công nghệ mạng được cập nhật thời gian thực.",
                fontSize = 12.sp,
                color = MagicTextSecondary,
                lineHeight = 16.sp
            )
        }

        // Network Lock Matrix (4636 Core)
        MagicOsCard(
            pillColor = MagicCyan,
            title = stringResource(R.string.cellular_lock_mode)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                NetworkModeLock.entries.forEach { mode ->
                    val isChecked = state.currentPreferredMode == mode
                    val title = when (mode) {
                        NetworkModeLock.MODE_5G_ONLY -> stringResource(R.string.mode_5g_only)
                        NetworkModeLock.MODE_4G_ONLY -> stringResource(R.string.mode_4g_only)
                        NetworkModeLock.MODE_NR_LTE -> stringResource(R.string.mode_nr_lte)
                        NetworkModeLock.MODE_AUTO -> stringResource(R.string.mode_auto)
                    }

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable { onSetLockMode(mode) },
                        color = if (isChecked) MagicCyan.copy(alpha = 0.10f) else Color.Transparent,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isChecked) MagicCyan.copy(alpha = 0.4f) else Color.Transparent
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isChecked,
                                onClick = { onSetLockMode(mode) },
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = MagicCyan,
                                    unselectedColor = MagicTextTertiary
                                )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = title,
                                fontSize = 14.sp,
                                fontWeight = if (isChecked) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (isChecked) MagicCyan else MagicTextPrimary
                            )
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
                            brush = MagicCardGradient,
                            onClick = onRestartRadio,
                            icon = Icons.Default.Refresh,
                            textColor = MagicCyan
                        )
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        MagicOsButton(
                            text = "Menu 4636 Gốc",
                            brush = MagicCardGradient,
                            onClick = onLaunchNativeRadioInfo,
                            icon = Icons.Default.OpenInNew,
                            textColor = MagicEmerald
                        )
                    }
                }
            }
        }

        // SMSC Controller Card
        MagicOsCard(
            pillColor = MagicAmber,
            title = stringResource(R.string.smsc_title)
        ) {
            Text(
                text = stringResource(R.string.smsc_desc),
                fontSize = 12.sp,
                color = MagicTextSecondary,
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = inputSmsc,
                onValueChange = { inputSmsc = it },
                label = { Text(stringResource(R.string.smsc_input_hint)) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MagicCyan,
                    unfocusedBorderColor = MagicCardBorder,
                    focusedLabelColor = MagicCyan,
                    unfocusedLabelColor = MagicTextSecondary,
                    focusedTextColor = MagicTextPrimary,
                    unfocusedTextColor = MagicTextPrimary,
                    focusedContainerColor = MagicCardSubtle,
                    unfocusedContainerColor = MagicCardSubtle
                ),
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontFamily = FontFamily.Monospace,
                    fontSize = 15.sp
                )
            )

            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = stringResource(R.string.smsc_apply_preset),
                fontSize = 12.sp,
                color = MagicTextSecondary
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                val presets = listOf(
                    "Viettel" to "+84980000015",
                    "VinaPhone" to "+8491020005",
                    "MobiFone" to "+84900000011",
                    "Wintel" to "+84559000000"
                )
                presets.forEach { (name, num) ->
                    val isSelected = inputSmsc == num
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20))
                            .clickable { inputSmsc = num },
                        color = if (isSelected) MagicCyan.copy(alpha = 0.2f) else MagicCardSubtle,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) MagicCyan else MagicCardBorder
                        )
                    ) {
                        Text(
                            text = name,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) MagicCyan else MagicTextSecondary,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            MagicOsButton(
                text = stringResource(R.string.smsc_btn_update),
                brush = MagicCyanGradient,
                onClick = { onUpdateSmsc(inputSmsc) },
                icon = Icons.Default.Send
            )
        }

        // BTS Base Station Field Test Card
        if (state.btsInfo != null) {
            val bts = state.btsInfo
            MagicOsCard(
                pillColor = MagicEmerald,
                title = stringResource(R.string.field_test_title),
                trailingContent = {
                    MagicCapsulePill(
                        text = if (bts.isCarrierAggregation) "CA Gộp Sóng 4G+/5G+" else "Băng Tần Đơn",
                        accentColor = if (bts.isCarrierAggregation) MagicEmerald else MagicTextSecondary
                    )
                }
            ) {
                val rsrpColor = when {
                    bts.rsrp >= -85 -> MagicEmerald
                    bts.rsrp >= -100 -> MagicCyan
                    bts.rsrp >= -115 -> MagicAmber
                    else -> MagicRed
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(stringResource(R.string.field_test_rsrp), fontSize = 13.sp, color = MagicTextSecondary)
                    Text(
                        text = "${bts.rsrp} dBm",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = rsrpColor,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.field_test_rsrq), fontSize = 13.sp, color = MagicTextSecondary)
                    Text("${bts.rsrq} dB", fontSize = 14.sp, color = MagicTextPrimary, fontFamily = FontFamily.Monospace)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.field_test_sinr), fontSize = 13.sp, color = MagicTextSecondary)
                    Text("${bts.sinr} dB", fontSize = 14.sp, color = MagicTextPrimary, fontFamily = FontFamily.Monospace)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.field_test_band), fontSize = 13.sp, color = MagicTextSecondary)
                    Text(bts.bandName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MagicCyan)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.field_test_distance), fontSize = 13.sp, color = MagicTextSecondary)
                    Text(
                        text = if (bts.timingAdvance > 0) "~${String.format("%.1f", bts.distanceMeters)} m (TA: ${bts.timingAdvance})" else "Không xác định",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MagicTextPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                }

                if (bts.secondaryBands.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(text = "Băng tần phụ đang gộp (Scell):", fontSize = 12.sp, color = MagicTextSecondary)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        bts.secondaryBands.forEach { secBand ->
                            MagicCapsulePill(text = secBand, accentColor = MagicCyan)
                        }
                    }
                }
            }
        } else {
            MagicOsCard(
                pillColor = MagicAmber,
                title = stringResource(R.string.field_test_title)
            ) {
                Text(
                    text = "Đang đọc tín hiệu trạm phát BTS vô tuyến từ modem... Đảm bảo máy đã cắm SIM hoạt động và đã cấp quyền Vị trí (ACCESS_FINE_LOCATION).",
                    fontSize = 12.sp,
                    color = MagicTextSecondary,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
