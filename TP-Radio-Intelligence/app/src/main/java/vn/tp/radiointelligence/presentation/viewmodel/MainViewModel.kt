package vn.tp.radiointelligence.presentation.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import vn.tp.radiointelligence.core.bluetooth.BluetoothController
import vn.tp.radiointelligence.core.cellular.TelephonyController
import vn.tp.radiointelligence.core.gnss.GnssController
import vn.tp.radiointelligence.core.magicos.MagicOsNetworkController
import vn.tp.radiointelligence.core.shizuku.ShizukuBridge
import vn.tp.radiointelligence.core.shizuku.ShizukuStatus
import vn.tp.radiointelligence.core.wifi.WifiController
import vn.tp.radiointelligence.domain.model.BluetoothState
import vn.tp.radiointelligence.domain.model.CellularState
import vn.tp.radiointelligence.domain.model.GnssState
import vn.tp.radiointelligence.domain.model.MagicOsNetworkFlags
import vn.tp.radiointelligence.domain.model.NetworkModeLock
import vn.tp.radiointelligence.domain.model.WifiState

class MainViewModel(application: Application) : AndroidViewModel(application) {

    val shizukuBridge = ShizukuBridge()
    private val telephonyController = TelephonyController(application, shizukuBridge)
    private val magicOsController = MagicOsNetworkController(shizukuBridge)
    private val gnssController = GnssController(application, shizukuBridge)
    private val wifiController = WifiController(application)
    private val bluetoothController = BluetoothController(application)

    val shizukuStatus: StateFlow<ShizukuStatus> = shizukuBridge.status
    val cellularState: StateFlow<CellularState> = telephonyController.cellularState
    val magicOsFlags: StateFlow<MagicOsNetworkFlags> = magicOsController.flags
    val gnssState: StateFlow<GnssState> = gnssController.gnssState
    val wifiState: StateFlow<WifiState> = wifiController.wifiState
    val bluetoothState: StateFlow<BluetoothState> = bluetoothController.bluetoothState

    private val _userMessage = MutableSharedFlow<String>()
    val userMessage: SharedFlow<String> = _userMessage.asSharedFlow()

    init {
        refreshAll()
    }

    fun refreshAll() {
        viewModelScope.launch {
            shizukuBridge.checkStatus()
            telephonyController.refreshAll()
            magicOsController.refreshFlags()
            wifiController.refreshWifi()
            bluetoothController.refreshAudioCodec()
        }
    }

    fun requestShizukuPermission() {
        shizukuBridge.requestPermission(1001, getApplication())
    }

    // --- Cellular Matrix Actions ---
    fun selectSimSlot(slotIndex: Int) {
        telephonyController.selectSlot(slotIndex)
        viewModelScope.launch {
            telephonyController.refreshAll()
        }
    }

    fun setNetworkModeLock(mode: NetworkModeLock) {
        val slot = cellularState.value.slots.getOrNull(cellularState.value.selectedSlotIndex)
        val subId = slot?.subId ?: 1
        viewModelScope.launch {
            telephonyController.setPreferredNetworkMode(subId, mode)
            _userMessage.emit("Đã chuyển chế độ khóa mạng sang: ${mode.name}")
        }
    }

    fun restartRadioModem() {
        val slot = cellularState.value.slots.getOrNull(cellularState.value.selectedSlotIndex)
        val subId = slot?.subId ?: 1
        viewModelScope.launch {
            telephonyController.restartRadioModem(subId)
            _userMessage.emit("Đã gửi tín hiệu khởi động lại modem sóng vật lý!")
        }
    }

    fun updateSmsc(smscNumber: String) {
        val slot = cellularState.value.slots.getOrNull(cellularState.value.selectedSlotIndex)
        val subId = slot?.subId ?: 1
        viewModelScope.launch {
            telephonyController.updateSmscAddress(subId, smscNumber)
            _userMessage.emit("Đã cập nhật SMSC thành công: $smscNumber")
        }
    }

    // --- MagicOS Flags Actions ---
    fun toggleLinkTurbo(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleLinkTurbo(enable)
        }
    }

    fun toggleForce5g(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleForce5g(enable)
        }
    }

    fun toggleDual5g(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleDual5g(enable)
        }
    }

    fun toggleSmartDualSim(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleSmartDualSim(enable)
        }
    }

    fun toggleMobileDataAlwaysOn(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleMobileDataAlwaysOn(enable)
        }
    }

    fun toggleAntiRogueBts(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleAntiRogueBts(enable)
        }
    }

    // --- GNSS Actions ---
    fun startGnssTracking() {
        gnssController.startTracking()
    }

    fun stopGnssTracking() {
        gnssController.stopTracking()
    }

    fun accelerateGps() {
        viewModelScope.launch {
            val ok = gnssController.accelerateGpsLock()
            if (ok) {
                _userMessage.emit("Đã nạp quỹ đạo XTRA & đồng bộ NTP! GPS sẵn sàng bắt trong 2-5 giây.")
            } else {
                _userMessage.emit("Đã gửi lệnh tăng tốc GPS.")
            }
        }
    }

    // --- Wi-Fi Actions ---
    fun runPingDiagnostics() {
        viewModelScope.launch {
            wifiController.runPingDiagnostics()
        }
    }

    // --- Bluetooth Actions ---
    fun toggleBleRadarScan() {
        if (bluetoothState.value.isScanning) {
            bluetoothController.stopBleRadar()
        } else {
            bluetoothController.startBleRadar()
        }
    }

    override fun onCleared() {
        super.onCleared()
        gnssController.stopTracking()
        bluetoothController.stopBleRadar()
        shizukuBridge.destroy()
    }
}

