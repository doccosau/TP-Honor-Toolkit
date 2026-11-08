package vn.tp.radiointelligence.presentation.magicos

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SignalCellularAlt
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.tp.radiointelligence.R
import vn.tp.radiointelligence.domain.model.MagicOsNetworkFlags
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.components.MagicOsCard
import vn.tp.radiointelligence.presentation.components.MagicOsSwitchRow
import vn.tp.radiointelligence.presentation.theme.*

@Composable
fun MagicOsScreen(
    flags: MagicOsNetworkFlags,
    onToggleLinkTurbo: (Boolean) -> Unit,
    onToggleForce5g: (Boolean) -> Unit,
    onToggleDual5g: (Boolean) -> Unit,
    onToggleSmartDualSim: (Boolean) -> Unit,
    onToggleMobileDataAlwaysOn: (Boolean) -> Unit,
    onToggleAntiRogueBts: (Boolean) -> Unit
) {
    val colors = LocalMagicColors.current
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // MagicOS Header Card
        MagicOsCard(
            pillColor = HonorBlue,
            title = stringResource(R.string.magicos_title),
            trailingContent = {
                MagicCapsulePill(
                    text = "MagicOS System Kernel",
                    accentColor = HonorBlue
                )
            }
        ) {
            Text(
                text = "Bộ điều khiển cờ mạng độc quyền của hệ điều hành MagicOS. Can thiệp trực tiếp vào subsystem Link Turbo, Baseband Modem và bộ lọc an ninh phần cứng.",
                fontSize = 12.sp,
                color = colors.textSecondary,
                lineHeight = 16.sp
            )
        }

        // Group 1: Tối ưu Tốc Độ & Modem 5G
        Text(
            text = "TỐC ĐỘ & GỘP BĂNG THÔNG",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textTertiary,
            modifier = Modifier.padding(start = 4.dp, top = 4.dp)
        )

        MagicOsSwitchRow(
            icon = Icons.Default.ElectricBolt,
            iconColor = HonorBlue,
            title = stringResource(R.string.magicos_link_turbo),
            description = stringResource(R.string.magicos_link_turbo_desc),
            isChecked = flags.linkTurboEnabled,
            onCheckedChange = onToggleLinkTurbo
        )

        MagicOsSwitchRow(
            icon = Icons.Default.Speed,
            iconColor = MagicEmerald,
            title = stringResource(R.string.magicos_force_5g),
            description = stringResource(R.string.magicos_force_5g_desc),
            isChecked = flags.force5gEnabled,
            onCheckedChange = onToggleForce5g
        )

        MagicOsSwitchRow(
            icon = Icons.Default.SignalCellularAlt,
            iconColor = HonorBlue,
            title = stringResource(R.string.magicos_dual_5g),
            description = stringResource(R.string.magicos_dual_5g_desc),
            isChecked = flags.dual5gEnabled,
            onCheckedChange = onToggleDual5g
        )

        // Group 2: Trải Nghiệm Mạng & Chuyển Đổi
        Text(
            text = "ĐỘ TRỄ & CHUYỂN MẠNG THÔNG MINH",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textTertiary,
            modifier = Modifier.padding(start = 4.dp, top = 6.dp)
        )

        MagicOsSwitchRow(
            icon = Icons.Default.Sync,
            iconColor = MagicAmber,
            title = stringResource(R.string.magicos_smart_dual_sim),
            description = stringResource(R.string.magicos_smart_dual_sim_desc),
            isChecked = flags.smartDualSimEnabled,
            onCheckedChange = onToggleSmartDualSim
        )

        MagicOsSwitchRow(
            icon = Icons.Default.Wifi,
            iconColor = MagicPurple,
            title = stringResource(R.string.magicos_mobile_data_always_on),
            description = stringResource(R.string.magicos_mobile_data_always_on_desc),
            isChecked = flags.mobileDataAlwaysOn,
            onCheckedChange = onToggleMobileDataAlwaysOn
        )

        // Group 3: An Ninh Vô Tuyến
        Text(
            text = "BẢO MẬT VÔ TUYẾN PHẦN CỨNG",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textTertiary,
            modifier = Modifier.padding(start = 4.dp, top = 6.dp)
        )

        MagicOsSwitchRow(
            icon = Icons.Default.Security,
            iconColor = MagicEmerald,
            title = stringResource(R.string.magicos_anti_rogue_bts),
            description = stringResource(R.string.magicos_anti_rogue_bts_desc),
            isChecked = flags.antiRogueBtsEnabled,
            onCheckedChange = onToggleAntiRogueBts
        )
    }
}
