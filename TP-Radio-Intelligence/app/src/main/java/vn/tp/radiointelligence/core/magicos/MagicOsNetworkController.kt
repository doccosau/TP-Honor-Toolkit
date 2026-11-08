package vn.tp.radiointelligence.core.magicos

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import vn.tp.radiointelligence.core.shizuku.ShizukuBridge
import vn.tp.radiointelligence.domain.model.MagicOsNetworkFlags

class MagicOsNetworkController(
    private val shizukuBridge: ShizukuBridge
) {
    private val _flags = MutableStateFlow(MagicOsNetworkFlags())
    val flags: StateFlow<MagicOsNetworkFlags> = _flags.asStateFlow()

    suspend fun refreshFlags() = withContext(Dispatchers.IO) {
        val linkTurbo = querySettingInt("system", "link_turbo_engine_status") == 1 ||
                querySettingInt("system", "wlan_network_acceleration") == 1

        val force5g = querySettingInt("system", "5g_power_save_switch") == 0 &&
                querySettingInt("global", "smart_5g_mode") == 0

        val dual5g = querySettingInt("global", "dual_card_5g_enable") == 1

        val smartDualSim = querySettingInt("system", "smart_dual_card_switch") == 1

        val mobileDataAlwaysOn = querySettingInt("global", "mobile_data_always_on") == 1

        val antiRogue = querySettingInt("global", "anti_pseudo_base_station_enabled") == 1 ||
                querySettingInt("system", "anti_pseudo_base_station_enabled") == 1

        _flags.value = MagicOsNetworkFlags(
            linkTurboEnabled = linkTurbo,
            force5gEnabled = force5g,
            dual5gEnabled = dual5g,
            smartDualSimEnabled = smartDualSim,
            mobileDataAlwaysOn = mobileDataAlwaysOn,
            antiRogueBtsEnabled = antiRogue
        )
    }

    suspend fun toggleLinkTurbo(enable: Boolean) = withContext(Dispatchers.IO) {
        val v = if (enable) "1" else "0"
        shizukuBridge.executeShellCommand("settings put system link_turbo_engine_status $v")
        shizukuBridge.executeShellCommand("settings put system wlan_network_acceleration $v")
        shizukuBridge.executeShellCommand("settings put global link_turbo_engine_status $v")
        _flags.value = _flags.value.copy(linkTurboEnabled = enable)
    }

    suspend fun toggleForce5g(enable: Boolean) = withContext(Dispatchers.IO) {
        // When force5g is enabled, 5g_power_save_switch is 0 and smart_5g_mode is 0
        val powerSave = if (enable) "0" else "1"
        val smartMode = if (enable) "0" else "1"
        shizukuBridge.executeShellCommand("settings put system 5g_power_save_switch $powerSave")
        shizukuBridge.executeShellCommand("settings put global smart_5g_mode $smartMode")
        _flags.value = _flags.value.copy(force5gEnabled = enable)
    }

    suspend fun toggleDual5g(enable: Boolean) = withContext(Dispatchers.IO) {
        val v = if (enable) "1" else "0"
        shizukuBridge.executeShellCommand("settings put global dual_card_5g_enable $v")
        shizukuBridge.executeShellCommand("settings put system dual_card_5g_enable $v")
        _flags.value = _flags.value.copy(dual5gEnabled = enable)
    }

    suspend fun toggleSmartDualSim(enable: Boolean) = withContext(Dispatchers.IO) {
        val v = if (enable) "1" else "0"
        shizukuBridge.executeShellCommand("settings put system smart_dual_card_switch $v")
        shizukuBridge.executeShellCommand("settings put global smart_dual_card_switch $v")
        _flags.value = _flags.value.copy(smartDualSimEnabled = enable)
    }

    suspend fun toggleMobileDataAlwaysOn(enable: Boolean) = withContext(Dispatchers.IO) {
        val v = if (enable) "1" else "0"
        shizukuBridge.executeShellCommand("settings put global mobile_data_always_on $v")
        _flags.value = _flags.value.copy(mobileDataAlwaysOn = enable)
    }

    suspend fun toggleAntiRogueBts(enable: Boolean) = withContext(Dispatchers.IO) {
        val v = if (enable) "1" else "0"
        shizukuBridge.executeShellCommand("settings put global anti_pseudo_base_station_enabled $v")
        shizukuBridge.executeShellCommand("settings put system anti_pseudo_base_station_enabled $v")
        _flags.value = _flags.value.copy(antiRogueBtsEnabled = enable)
    }

    private suspend fun querySettingInt(table: String, key: String): Int {
        val out = shizukuBridge.executeShellCommand("settings get $table $key")
        return out.trim().toIntOrNull() ?: -1
    }
}

