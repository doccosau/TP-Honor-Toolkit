package vn.tp.radiointelligence.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.flow.collectLatest
import vn.tp.radiointelligence.R
import vn.tp.radiointelligence.presentation.bluetooth.BluetoothScreen
import vn.tp.radiointelligence.presentation.cellular.CellularScreen
import vn.tp.radiointelligence.presentation.components.MagicBackgroundWaves
import vn.tp.radiointelligence.presentation.components.MagicCapsulePill
import vn.tp.radiointelligence.presentation.gnss.GnssScreen
import vn.tp.radiointelligence.presentation.magicos.MagicOsScreen
import vn.tp.radiointelligence.presentation.theme.*
import vn.tp.radiointelligence.presentation.viewmodel.MainViewModel
import vn.tp.radiointelligence.presentation.wifi.WifiScreen

enum class RadioTab(val titleRes: Int, val icon: ImageVector) {
    CELLULAR(R.string.tab_cellular, Icons.Default.CellTower),
    MAGICOS(R.string.tab_magicos, Icons.Default.Speed),
    GNSS(R.string.tab_gnss, Icons.Default.Radar),
    WIFI(R.string.tab_wifi, Icons.Default.Wifi),
    BLUETOOTH(R.string.tab_bluetooth, Icons.Default.Headphones)
}

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        viewModel.refreshAll()
        viewModel.startGnssTracking()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkAndRequestPermissions()

        setContent {
            val systemDark = isSystemInDarkTheme()
            var userDarkChoice by remember { mutableStateOf<Boolean?>(null) }
            val isDarkEffective = userDarkChoice ?: systemDark

            TPRadioIntelligenceTheme(darkTheme = isDarkEffective) {
                val colors = LocalMagicColors.current
                val snackbarHostState = remember { SnackbarHostState() }
                var selectedTab by remember { mutableStateOf(RadioTab.CELLULAR) }

                val shizukuStatus by viewModel.shizukuStatus.collectAsStateWithLifecycle()
                val cellularState by viewModel.cellularState.collectAsStateWithLifecycle()
                val magicOsFlags by viewModel.magicOsFlags.collectAsStateWithLifecycle()
                val gnssState by viewModel.gnssState.collectAsStateWithLifecycle()
                val wifiState by viewModel.wifiState.collectAsStateWithLifecycle()
                val btState by viewModel.bluetoothState.collectAsStateWithLifecycle()

                LaunchedEffect(Unit) {
                    viewModel.userMessage.collectLatest { msg ->
                        snackbarHostState.showSnackbar(msg)
                    }
                }

                LaunchedEffect(Unit) {
                    viewModel.startGnssTracking()
                }

                Scaffold(
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    containerColor = colors.bg,
                    topBar = {
                        MagicTopAppBar(
                            shizukuConnected = shizukuStatus.hasPermission,
                            isDark = isDarkEffective,
                            onToggleTheme = {
                                userDarkChoice = !isDarkEffective
                            },
                            onRequestShizuku = { viewModel.requestShizukuPermission() },
                            onRefresh = { viewModel.refreshAll() }
                        )
                    },
                    bottomBar = {
                        MagicBottomNavigationBar(
                            selectedTab = selectedTab,
                            onTabSelected = { selectedTab = it }
                        )
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        // Subtle Telecom RF Wave Motifs in Background
                        MagicBackgroundWaves()

                        when (selectedTab) {
                            RadioTab.CELLULAR -> CellularScreen(
                                state = cellularState,
                                onSelectSlot = { viewModel.selectSimSlot(it) },
                                onSetLockMode = { viewModel.setNetworkModeLock(it) },
                                onRestartRadio = { viewModel.restartRadioModem() },
                                onLaunchNativeRadioInfo = { viewModel.launchNativeRadioInfo() },
                                onUpdateSmsc = { viewModel.updateSmsc(it) },
                                onReadSmscFromSim = { viewModel.readSmscFromSim() }
                            )
                            RadioTab.MAGICOS -> MagicOsScreen(
                                flags = magicOsFlags,
                                onToggleLinkTurbo = { viewModel.toggleLinkTurbo(it) },
                                onToggleForce5g = { viewModel.toggleForce5g(it) },
                                onToggleDual5g = { viewModel.toggleDual5g(it) },
                                onToggleSmartDualSim = { viewModel.toggleSmartDualSim(it) },
                                onToggleMobileDataAlwaysOn = { viewModel.toggleMobileDataAlwaysOn(it) },
                                onToggleAntiRogueBts = { viewModel.toggleAntiRogueBts(it) }
                            )
                            RadioTab.GNSS -> GnssScreen(
                                state = gnssState,
                                onAccelerateGps = { viewModel.accelerateGps() }
                            )
                            RadioTab.WIFI -> WifiScreen(
                                state = wifiState,
                                onRunPing = { viewModel.runPingDiagnostics() }
                            )
                            RadioTab.BLUETOOTH -> BluetoothScreen(
                                state = btState,
                                onToggleScan = { viewModel.toggleBleRadarScan() }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            requestPermissionLauncher.launch(missing.toTypedArray())
        }
    }
}

@Composable
fun MagicTopAppBar(
    shizukuConnected: Boolean,
    isDark: Boolean,
    onToggleTheme: () -> Unit,
    onRequestShizuku: () -> Unit,
    onRefresh: () -> Unit
) {
    val colors = LocalMagicColors.current

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = colors.card,
        border = androidx.compose.foundation.BorderStroke(0.5.dp, colors.cardBorder),
        shadowElevation = if (colors.isDark) 0.dp else 1.dp
    ) {
        Column(
            modifier = Modifier
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(RoundedCornerShape(5.dp))
                            .background(HonorBlue)
                    )
                    Column {
                        Text(
                            text = stringResource(R.string.app_name),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                        Text(
                            text = "Honor MagicOS Telecom Suite",
                            fontSize = 11.sp,
                            color = colors.textSecondary
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    MagicCapsulePill(
                        text = if (shizukuConnected) "UID 2000 RIL" else "Cấp Shizuku",
                        accentColor = if (shizukuConnected) MagicEmerald else MagicAmber,
                        onClick = if (!shizukuConnected) onRequestShizuku else null
                    )

                    IconButton(
                        onClick = onToggleTheme,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle Theme",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(19.dp)
                        )
                    }

                    IconButton(
                        onClick = onRefresh,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = null,
                            tint = colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MagicBottomNavigationBar(
    selectedTab: RadioTab,
    onTabSelected: (RadioTab) -> Unit
) {
    val colors = LocalMagicColors.current

    NavigationBar(
        containerColor = colors.card,
        contentColor = colors.textPrimary,
        tonalElevation = if (colors.isDark) 4.dp else 8.dp
    ) {
        RadioTab.entries.forEach { tab ->
            val isSelected = tab == selectedTab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    Icon(
                        tab.icon,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                },
                label = {
                    Text(
                        text = stringResource(tab.titleRes),
                        fontSize = 10.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = HonorBlue,
                    selectedTextColor = HonorBlue,
                    unselectedIconColor = colors.textTertiary,
                    unselectedTextColor = colors.textTertiary,
                    indicatorColor = HonorBlue.copy(alpha = if (colors.isDark) 0.18f else 0.12f)
                )
            )
        }
    }
}
