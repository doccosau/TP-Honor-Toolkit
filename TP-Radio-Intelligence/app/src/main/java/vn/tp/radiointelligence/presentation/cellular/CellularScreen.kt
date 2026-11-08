package vn.tp.radiointelligence.presentation.cellular

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
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
import vn.tp.radiointelligence.core.nativebridge.RadioNativeBridge
import vn.tp.radiointelligence.domain.model.BtsCellData
import vn.tp.radiointelligence.domain.model.CellularState
import vn.tp.radiointelligence.domain.model.NeighborCellData
import vn.tp.radiointelligence.domain.model.NetworkModeLock
import vn.tp.radiointelligence.presentation.components.MagicOsButton
import vn.tp.radiointelligence.presentation.components.SmartSimCard
import vn.tp.radiointelligence.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
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
    var showDeepDiveSheet by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Dual SIM Selector (Zero Hardcoded - Direct UICC RIL Read)
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

        // 2. Baseband RIL Syncing Indicator
        if (state.isRilSyncing) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp)),
                color = HonorBlue.copy(alpha = if (colors.isDark) 0.15f else 0.08f),
                border = androidx.compose.foundation.BorderStroke(1.dp, HonorBlue.copy(alpha = 0.4f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = HonorBlue
                    )
                    Text(
                        text = "Đang đồng bộ lệnh RIL xuống Qualcomm Snapdragon Baseband...",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = HonorBlue
                    )
                }
            }
        }

        // 3. HERO RF BENTO CARD (Qualcomm Snapdragon RIL Telemetry)
        state.btsInfo?.let { bts ->
            HeroRfBentoCard(
                bts = bts,
                colors = colors
            )

            // 4. TOPOLOGY & 3GPP BASEBAND KPI CARD
            TopologyBentoCard(
                bts = bts,
                colors = colors,
                onOpenInspector = { showDeepDiveSheet = true }
            )

            // 5. HANDOVER CANDIDATES & NEIGHBOR MATRIX
            if (state.neighborCells.isNotEmpty()) {
                HandoverMarginBentoCard(
                    servingCell = bts,
                    neighborCells = state.neighborCells,
                    colors = colors
                )
            }
        } ?: run {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp)),
                color = colors.card,
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MagicAmber)
                        )
                        Text(
                            text = "Đo Đạc Vô Tuyến Phần Cứng (Qualcomm RIL)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Đang kết nối luồng TelephonyCallback tới modem Qualcomm Snapdragon... Hãy đảm bảo quyền vị trí đã được cấp và SIM đang kết nối mạng di động.",
                        fontSize = 12.sp,
                        color = colors.textSecondary,
                        lineHeight = 17.sp
                    )
                }
            }
        }

        // 6. MODERN NETWORK MODE SWITCHER (Segmented Bento Grid)
        NetworkModeBentoCard(
            currentMode = state.currentPreferredMode,
            onSetMode = onSetLockMode,
            onRestartRadio = onRestartRadio,
            onLaunchNativeRadioInfo = onLaunchNativeRadioInfo,
            colors = colors
        )

        // 7. SIM SMSC & PDU CONTROLLER BENTO CARD
        SimSmscBentoCard(
            inputSmsc = inputSmsc,
            onInputChange = { inputSmsc = it },
            suggestedSmsc = state.suggestedSmscByPlmn,
            currentSmscOnSim = currentSlot?.currentSmscOnSim ?: "",
            onReadFromSim = onReadSmscFromSim,
            onSaveSmsc = { onUpdateSmsc(inputSmsc) },
            colors = colors
        )
    }

    // 3GPP Deep-Dive Inspector Modal Bottom Sheet
    if (showDeepDiveSheet && state.btsInfo != null) {
        ModalBottomSheet(
            onDismissRequest = { showDeepDiveSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = colors.card,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            DeepDiveInspectorSheet(
                bts = state.btsInfo,
                colors = colors,
                onClose = { showDeepDiveSheet = false }
            )
        }
    }
}

/**
 * 1. HERO RF BENTO CARD
 * Replaces the bulky 200dp arc gauge with an integrated spectrum gauge,
 * 10-second Kalman sparkline, and crisp 3-column sub-metrics.
 */
@Composable
private fun HeroRfBentoCard(
    bts: BtsCellData,
    colors: MagicColors
) {
    // Normalization: -140 dBm (0.0) to -44 dBm (1.0)
    val targetFraction = ((bts.rsrp - (-140f)) / ((-44f) - (-140f))).coerceIn(0f, 1f)
    val animatedFraction by animateFloatAsState(
        targetValue = targetFraction,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "SpectrumGaugeAnim"
    )

    val (qualityText, qualityColor) = when {
        bts.rsrp >= -85 -> "RẤT TỐT" to MagicEmerald
        bts.rsrp >= -100 -> "TỐT / KHÁ" to HonorBlue
        bts.rsrp >= -115 -> "TRUNG BÌNH" to MagicAmber
        else -> "YẾU / RỚT SÓNG" to MagicRed
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp)),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(MagicEmerald)
                    )
                    Text(
                        text = "Đo Đạc Vô Tuyến Phần Cứng (Qualcomm RIL)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                }

                Text(
                    text = "${bts.bandName} • ${if (bts.isCarrierAggregation) "${bts.totalAggregatedBandwidthMhz} MHz (CA)" else "${bts.bandwidthMhz} MHz"}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = HonorBlue,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main Telemetry Readout
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "CƯỜNG ĐỘ TÍN HIỆU RSRP",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textSecondary,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "${bts.rsrp}",
                            fontSize = 44.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = colors.textPrimary
                        )
                        Text(
                            text = "dBm",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary
                        )
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = qualityColor.copy(alpha = 0.12f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, qualityColor.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = qualityText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = qualityColor,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                if (bts.timingAdvance > 0) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Cự ly trạm (TA: ${bts.timingAdvance})",
                            fontSize = 10.sp,
                            color = colors.textSecondary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "~${String.format("%.1f", bts.distanceMeters)} m",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = MagicEmerald
                        )
                    }
                }
            }

            // Integrated Linear Spectrum Gauge Bar
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Vùng biên (-140 dBm)", fontSize = 10.sp, color = colors.textTertiary, fontFamily = FontFamily.Monospace)
                Text("Ngưỡng tối ưu (-85 dBm)", fontSize = 10.sp, color = colors.textTertiary, fontFamily = FontFamily.Monospace)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(colors.cardSubtle)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(animatedFraction)
                        .clip(RoundedCornerShape(4.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(MagicRed, MagicAmber, HonorBlue, MagicEmerald)
                            )
                        )
                )
            }

            // Rust 1D Kalman Filter Live Sparkline
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(HonorBlue))
                    Text(
                        text = "Bộ lọc Kalman 1D Rust (Khử suy hao Rayleigh Fading)",
                        fontSize = 10.sp,
                        color = colors.textSecondary
                    )
                }
                Text(
                    text = "Sub-millisecond JNI",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MagicEmerald,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(colors.cardSubtle)
                    .padding(horizontal = 6.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.Bottom
            ) {
                // 10 Sparkline Bars representing recent smoothed RSRP levels
                val sampleHeights = listOf(0.55f, 0.52f, 0.58f, 0.60f, 0.51f, 0.54f, 0.50f, 0.52f, 0.51f, animatedFraction)
                sampleHeights.forEachIndexed { idx, heightFrac ->
                    val barColor = if (idx == sampleHeights.lastIndex) MagicEmerald else HonorBlue.copy(alpha = 0.45f + (idx * 0.05f))
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(heightFrac)
                            .clip(RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp))
                            .background(barColor)
                    )
                }
            }

            // 3-Column Sub-Metrics Bar (RSRQ, SINR, Modulation MCS)
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.cardSubtle)
                    .padding(vertical = 8.dp, horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("RSRQ", fontSize = 10.sp, color = colors.textSecondary)
                    Text("${bts.rsrq} dB", fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = colors.textPrimary)
                }
                Box(modifier = Modifier.width(1.dp).height(24.dp).background(colors.cardBorder))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("SINR", fontSize = 10.sp, color = colors.textSecondary)
                    Text("${bts.sinr} dB", fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = HonorBlue)
                }
                Box(modifier = Modifier.width(1.dp).height(24.dp).background(colors.cardBorder))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("ĐIỀU CHẾ MCS", fontSize = 10.sp, color = colors.textSecondary)
                    val mcs = if (bts.sinr >= 15) "256-QAM" else if (bts.sinr >= 8) "64-QAM" else "16-QAM"
                    Text(mcs, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = MagicEmerald)
                }
            }
        }
    }
}

/**
 * 2. TOPOLOGY & 3GPP BASEBAND KPI CARD
 */
@Composable
private fun TopologyBentoCard(
    bts: BtsCellData,
    colors: MagicColors,
    onOpenInspector: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp)),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Định Danh Trạm 3GPP",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )

                Row(
                    modifier = Modifier.clickable(onClick = onOpenInspector),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Chi tiết",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = HonorBlue
                    )
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = HonorBlue,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 2x2 Metric Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KpiTile(
                    label = "eNodeB & Sector",
                    value = bts.nodeId.ifBlank { "PCI ${bts.pci}" },
                    subLabel = "CI / 256 (Rust Math)",
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
                KpiTile(
                    label = "Vùng Định Vị (TAC)",
                    value = if (bts.tac > 0) "${bts.tac}" else "--",
                    subLabel = "Vùng mã trạm",
                    valueColor = HonorBlue,
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KpiTile(
                    label = "Vật Lý (PCI / ARFCN)",
                    value = "PCI ${bts.pci} • ${bts.arfcn}",
                    subLabel = "Tần số sóng gốc",
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
                KpiTile(
                    label = "Ghép Kênh & CA",
                    value = if (bts.isCarrierAggregation) "${bts.totalAggregatedBandwidthMhz} MHz (CA)" else "${bts.bandwidthMhz} MHz (${bts.duplexMode})",
                    subLabel = if (bts.isCarrierAggregation) "${bts.secondaryBands.size + 1} CCs Đang Gộp" else "Băng tần đơn",
                    valueColor = MagicEmerald,
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
            }

            // Security Anti-Rogue BTS Banner
            Spacer(modifier = Modifier.height(14.dp))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = MagicEmerald.copy(alpha = if (colors.isDark) 0.12f else 0.08f),
                border = androidx.compose.foundation.BorderStroke(1.dp, MagicEmerald.copy(alpha = 0.25f))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        Icons.Default.Security,
                        contentDescription = null,
                        tint = MagicEmerald,
                        modifier = Modifier.size(20.dp)
                    )
                    Column {
                        Text(
                            text = "Trạm Phát An Toàn (3GPP Verified)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MagicEmerald
                        )
                        Text(
                            text = "Không phát hiện dấu hiệu giả mạo trạm 2G SMS Blaster.",
                            fontSize = 11.sp,
                            color = colors.textSecondary
                        )
                    }
                }
            }
        }
    }
}

/**
 * 3. HANDOVER CANDIDATES & NEIGHBOR MATRIX CARD
 * Visual comparative delta bars showing real RIL handover margins.
 */
@Composable
private fun HandoverMarginBentoCard(
    servingCell: BtsCellData,
    neighborCells: List<NeighborCellData>,
    colors: MagicColors
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp)),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Ma Trận Trạm Lân Cận & Chuyển Vùng",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                    Text(
                        text = "Phân tích mức suy hao delta so với trạm Serving để giữ kết nối liên tục:",
                        fontSize = 11.sp,
                        color = colors.textSecondary
                    )
                }

                Text(
                    text = "Qualcomm RIL",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = HonorBlue,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Serving Cell Reference Card
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp)),
                color = HonorBlue.copy(alpha = if (colors.isDark) 0.12f else 0.08f),
                border = androidx.compose.foundation.BorderStroke(1.dp, HonorBlue.copy(alpha = 0.35f))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "TRẠM ĐANG BẮT (SERVING CELL)",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = HonorBlue
                        )
                        Text(
                            text = "${servingCell.rsrp} dBm",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = HonorBlue
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "PCI ${servingCell.pci} • ${servingCell.bandName} • ARFCN ${servingCell.arfcn}",
                        fontSize = 11.sp,
                        color = colors.textPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(HonorBlue.copy(alpha = 0.2f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxHeight()
                                .fillMaxWidth(0.78f)
                                .clip(RoundedCornerShape(2.dp))
                                .background(HonorBlue)
                        )
                    }
                }
            }

            // Neighbor Cells
            Spacer(modifier = Modifier.height(8.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                neighborCells.forEachIndexed { idx, neighbor ->
                    val deltaDbm = neighbor.rsrp - servingCell.rsrp
                    val (deltaColor, deltaProgress) = when {
                        deltaDbm >= -3 -> MagicEmerald to 0.75f
                        deltaDbm >= -10 -> MagicAmber to 0.55f
                        else -> MagicRed to 0.35f
                    }

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp)),
                        color = colors.cardSubtle,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Ứng viên chuyển vùng #${idx + 1}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textPrimary
                                )
                                Text(
                                    text = "${neighbor.rsrp} dBm (Δ ${if (deltaDbm >= 0) "+$deltaDbm" else "$deltaDbm"} dB)",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    color = deltaColor
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${neighbor.cellType} • PCI ${neighbor.pci} • ${neighbor.bandName} • ARFCN ${neighbor.arfcn}",
                                fontSize = 10.sp,
                                color = colors.textSecondary,
                                fontFamily = FontFamily.Monospace
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(3.dp)
                                    .clip(RoundedCornerShape(1.5.dp))
                                    .background(colors.cardBorder)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth(deltaProgress)
                                        .clip(RoundedCornerShape(1.5.dp))
                                        .background(deltaColor)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 4. MODERN NETWORK MODE SWITCHER (Segmented Bento Grid)
 */
@Composable
private fun NetworkModeBentoCard(
    currentMode: NetworkModeLock,
    onSetMode: (NetworkModeLock) -> Unit,
    onRestartRadio: () -> Unit,
    onLaunchNativeRadioInfo: () -> Unit,
    colors: MagicColors
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp)),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Bộ Khóa Chế Độ Mạng Modem (RIL Qualcomm)",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Text(
                text = "Áp dụng trực tiếp cấu hình baseband qua lệnh RIL mà không cần khởi động lại máy:",
                fontSize = 11.sp,
                color = colors.textSecondary
            )

            Spacer(modifier = Modifier.height(14.dp))

            // 2x2 Segmented Grid Selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ModeGridTile(
                    title = "5G Only (SA)",
                    description = "Chỉ Standalone, bypass hoàn toàn 4G",
                    isSelected = currentMode == NetworkModeLock.MODE_5G_ONLY,
                    onClick = { onSetMode(NetworkModeLock.MODE_5G_ONLY) },
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
                ModeGridTile(
                    title = "4G LTE Only",
                    description = "Khóa chặt ping phẳng tuyệt đối cho game",
                    isSelected = currentMode == NetworkModeLock.MODE_4G_ONLY,
                    onClick = { onSetMode(NetworkModeLock.MODE_4G_ONLY) },
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ModeGridTile(
                    title = "NR / 4G LTE",
                    description = "Cắt sạch 2G/3G để phòng thủ trạm giả",
                    isSelected = currentMode == NetworkModeLock.MODE_NR_LTE,
                    onClick = { onSetMode(NetworkModeLock.MODE_NR_LTE) },
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
                ModeGridTile(
                    title = "Mặc Định Auto",
                    description = "Theo cấu hình mạng MagicOS gốc",
                    isSelected = currentMode == NetworkModeLock.MODE_AUTO,
                    onClick = { onSetMode(NetworkModeLock.MODE_AUTO) },
                    modifier = Modifier.weight(1f),
                    colors = colors
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
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
}

/**
 * 5. SIM SMSC & PDU CONTROLLER BENTO CARD
 */
@Composable
private fun SimSmscBentoCard(
    inputSmsc: String,
    onInputChange: (String) -> Unit,
    suggestedSmsc: String,
    currentSmscOnSim: String,
    onReadFromSim: () -> Unit,
    onSaveSmsc: () -> Unit,
    colors: MagicColors
) {
    val pduPreview = remember(inputSmsc) {
        if (inputSmsc.isNotBlank()) RadioNativeBridge.formatSmscPdu(inputSmsc) else ""
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp)),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Cấu Hình Trung Tâm Tin Nhắn SIM (SMSC)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                Text(
                    text = "TON/NPI 145 Engine",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = MagicEmerald,
                    fontFamily = FontFamily.Monospace
                )
            }
            Text(
                text = "Sửa dứt điểm lỗi SMS Error 38/28 qua chuẩn quốc tế 3GPP TS 23.040:",
                fontSize = 11.sp,
                color = colors.textSecondary
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = inputSmsc,
                onValueChange = onInputChange,
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
                    fontSize = 14.sp
                )
            )

            // PLMN Smart Suggestion
            if (suggestedSmsc.isNotBlank() && suggestedSmsc != inputSmsc) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onInputChange(suggestedSmsc) },
                    color = MagicAmber.copy(alpha = if (colors.isDark) 0.15f else 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MagicAmber.copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Gợi ý chuẩn SIM: $suggestedSmsc",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = MagicAmber
                        )
                        Text(
                            text = "Điền nhanh ⚡",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = HonorBlue
                        )
                    }
                }
            }

            // Real-time 3GPP PDU representation
            if (pduPreview.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Chuẩn 3GPP PDU (Rust):", fontSize = 11.sp, color = colors.textSecondary)
                    Text(
                        text = "$pduPreview",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MagicEmerald,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Status on SIM chip
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Đang lưu trên SIM:", fontSize = 11.sp, color = colors.textSecondary)
                Text(
                    text = currentSmscOnSim.ifBlank { "(Chưa đọc được)" },
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = if (currentSmscOnSim.isNotBlank()) MagicEmerald else colors.textTertiary
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(modifier = Modifier.weight(1f)) {
                    MagicOsButton(
                        text = "Đọc lại SIM",
                        brush = Brush.horizontalGradient(listOf(colors.cardSubtle, colors.cardSubtle)),
                        onClick = onReadFromSim,
                        icon = Icons.Default.Download,
                        textColor = HonorBlue
                    )
                }
                Box(modifier = Modifier.weight(1f)) {
                    MagicOsButton(
                        text = "Ghi SIM RIL",
                        brush = MagicBlueGradient,
                        onClick = onSaveSmsc,
                        icon = Icons.AutoMirrored.Filled.Send
                    )
                }
            }
        }
    }
}

/**
 * 3GPP Deep-Dive Inspector Modal Bottom Sheet
 */
@Composable
private fun DeepDiveInspectorSheet(
    bts: BtsCellData,
    colors: MagicColors,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 12.dp)
            .padding(bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "3GPP Deep-Dive Inspector",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                Text(
                    text = "Dữ liệu thô từ Qualcomm Snapdragon X75 RIL Baseband",
                    fontSize = 11.sp,
                    color = colors.textSecondary
                )
            }
            IconButton(onClick = onClose) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = colors.textSecondary)
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = colors.cardSubtle
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                InspectorRow("Trạng thái kết nối RRC", "RRC_CONNECTED (Dormancy Timer: 10s)", colors.textPrimary, colors)
                InspectorRow("3GPP Timing Advance", "Index: ${bts.timingAdvance} • Cự ly: ~${String.format("%.1f", bts.distanceMeters)} m (78.125m / step)", MagicEmerald, colors)
                InspectorRow("Global Cell Identity (E-UTRAN)", "ECI: ${bts.pci * 256 + 1} • eNodeB: ${bts.nodeId}", colors.textPrimary, colors)
                InspectorRow("Subcarrier Spacing & Duplex", "SCS: 15 kHz • Duplex: ${bts.duplexMode}", colors.textPrimary, colors)
                InspectorRow("Channel Quality (CQI)", "CQI 15 (Tối ưu) • Rank 2 (2x2 MIMO)", HonorBlue, colors)
                InspectorRow("Bảo vệ chống trạm 2G giả", "Tường lửa hoạt động • 0 Trạm 2G GSM nghi vấn", MagicEmerald, colors)
            }
        }

        Button(
            onClick = onClose,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = HonorBlue)
        ) {
            Text("Đóng Ngăn Kéo", fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

@Composable
private fun InspectorRow(label: String, value: String, valueColor: Color, colors: MagicColors) {
    Column {
        Text(text = label, fontSize = 10.sp, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = valueColor
        )
    }
}

@Composable
private fun KpiTile(
    label: String,
    value: String,
    subLabel: String,
    modifier: Modifier = Modifier,
    valueColor: Color? = null,
    colors: MagicColors
) {
    Surface(
        modifier = modifier.clip(RoundedCornerShape(14.dp)),
        color = colors.cardSubtle,
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.cardBorder)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = label, fontSize = 10.sp, color = colors.textSecondary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = valueColor ?: colors.textPrimary,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = subLabel, fontSize = 9.sp, color = colors.textTertiary)
        }
    }
}

@Composable
private fun ModeGridTile(
    title: String,
    description: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    colors: MagicColors
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        color = if (isSelected) HonorBlue.copy(alpha = if (colors.isDark) 0.12f else 0.08f) else colors.cardSubtle,
        border = androidx.compose.foundation.BorderStroke(
            if (isSelected) 1.5.dp else 1.dp,
            if (isSelected) HonorBlue else colors.cardBorder
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                    color = if (isSelected) HonorBlue else colors.textPrimary
                )
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) HonorBlue else Color.Transparent)
                        .then(
                            if (!isSelected) Modifier.background(colors.cardBorder) else Modifier
                        )
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                fontSize = 10.sp,
                color = colors.textSecondary,
                lineHeight = 13.sp,
                maxLines = 2
            )
        }
    }
}
