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
        val slotIndex = slot?.slotIndex ?: 0
        viewModelScope.launch {
            telephonyController.setPreferredNetworkMode(subId, slotIndex, mode)
            _userMessage.emit("Đã khóa chế độ mạng sang: ${mode.name}")
        }
    }

    fun restartRadioModem() {
        val slot = cellularState.value.slots.getOrNull(cellularState.value.selectedSlotIndex)
        val subId = slot?.subId ?: 1
        viewModelScope.launch {
            telephonyController.restartRadioModem(subId)
            _userMessage.emit("Đã khởi động lại modem sóng vật lý!")
        }
    }

    fun launchNativeRadioInfo() {
        viewModelScope.launch {
            val ok = telephonyController.launchNativeRadioInfo()
            if (ok) {
                _userMessage.emit("Đang mở menu RadioInfo gốc hệ thống...")
            } else {
                _userMessage.emit("Không thể mở RadioInfo qua Shizuku.")
            }
        }
    }

    fun updateSmsc(smscNumber: String) {
        val slot = cellularState.value.slots.getOrNull(cellularState.value.selectedSlotIndex)
        val subId = slot?.subId ?: 1
        viewModelScope.launch {
            telephonyController.updateSmscAddress(subId, smscNumber)
            _userMessage.emit("Đã cập nhật số SMSC: $smscNumber")
        }
    }

    // --- MagicOS Flags Actions ---
    fun toggleLinkTurbo(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleLinkTurbo(enable)
            _userMessage.emit(if (enable) "Đã kích hoạt Link Turbo Pro" else "Đã tắt Link Turbo Pro")
        }
    }

    fun toggleForce5g(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleForce5g(enable)
            _userMessage.emit(if (enable) "Đã bật Ép 5G Toàn thời gian (Bypass Smart 5G)" else "Đã tắt Ép 5G Toàn thời gian")
        }
    }

    fun toggleDual5g(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleDual5g(enable)
            _userMessage.emit(if (enable) "Đã mở khóa Dual 5G trên cả 2 SIM" else "Đã tắt Dual 5G")
        }
    }

    fun toggleSmartDualSim(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleSmartDualSim(enable)
            _userMessage.emit(if (enable) "Đã bật Đổi SIM Data Thông minh (0.5s failover)" else "Đã tắt Đổi SIM Data Thông minh")
        }
    }

    fun toggleMobileDataAlwaysOn(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleMobileDataAlwaysOn(enable)
            _userMessage.emit(if (enable) "Đã bật Dữ liệu di động luôn kết nối ngầm" else "Đã tắt Dữ liệu di động luôn bật")
        }
    }

    fun toggleAntiRogueBts(enable: Boolean) {
        viewModelScope.launch {
            magicOsController.toggleAntiRogueBts(enable)
            _userMessage.emit(if (enable) "Đã kích hoạt Tường lửa chống trạm BTS giả 2G" else "Đã tắt Tường lửa chống trạm giả")
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
                _userMessage.emit("Đã nạp quỹ đạo XTRA & đồng bộ NTP! Bắt đầu định vị vệ tinh.")
            } else {
                _userMessage.emit("Đã gửi lệnh tăng tốc định vị GPS.")
            }
        }
    }

    // --- Wi-Fi Actions ---
    fun runPingDiagnostics() {
        viewModelScope.launch {
            _userMessage.emit("Đang đo kiểm ping trực tiếp tới 4 máy chủ...")
            wifiController.runPingDiagnostics()
            _userMessage.emit("Đo kiểm ping hoàn tất!")
        }
    }

    // --- Bluetooth Actions ---
    fun toggleBleRadarScan() {
        if (bluetoothState.value.isScanning) {
            bluetoothController.stopBleRadar()
            viewModelScope.launch { _userMessage.emit("Đã dừng quét BLE Radar") }
        } else {
            bluetoothController.startBleRadar()
            viewModelScope.launch { _userMessage.emit("Đang quét tìm thiết bị BLE xung quanh...") }
        }
    }

    override fun onCleared() {
        super.onCleared()
        gnssController.stopTracking()
        bluetoothController.stopBleRadar()
        shizukuBridge.destroy()
    }
}
