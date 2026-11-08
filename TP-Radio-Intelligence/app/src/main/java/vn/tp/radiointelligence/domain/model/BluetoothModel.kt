package vn.tp.radiointelligence.domain.model

data class BleDeviceItem(
    val name: String,
    val address: String,
    val rssi: Int,
    val estimatedDistanceMeters: Double,
    val lastSeenTimestamp: Long
)

data class BluetoothState(
    val isEnabled: Boolean = false,
    val activeDeviceName: String? = null,
    val activeCodecName: String = "L2HC / LDAC Hi-Res",
    val sampleRateKhz: Int = 96,
    val bitDepth: Int = 24,
    val isScanning: Boolean = false,
    val scannedDevices: List<BleDeviceItem> = emptyList()
)

