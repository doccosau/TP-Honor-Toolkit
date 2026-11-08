package vn.tp.radiointelligence.domain.model

data class SimSlotInfo(
    val slotIndex: Int,
    val subId: Int,
    val carrierName: String,
    val displayName: String,
    val isDataActive: Boolean
)

enum class NetworkModeLock(val code: Int) {
    MODE_5G_ONLY(29),
    MODE_4G_ONLY(11),
    MODE_NR_LTE(22),
    MODE_AUTO(20);

    companion object {
        fun fromCode(code: Int): NetworkModeLock {
            return entries.firstOrNull { it.code == code } ?: MODE_AUTO
        }
    }
}

data class BtsCellData(
    val cellType: String = "LTE",
    val pci: Int = 0,
    val arfcn: Int = 0,
    val bandName: String = "B3 (1800 MHz)",
    val rsrp: Int = -95,
    val rsrq: Int = -10,
    val sinr: Int = 12,
    val timingAdvance: Int = 5,
    val distanceMeters: Double = 390.6,
    val isCarrierAggregation: Boolean = false,
    val secondaryBands: List<String> = emptyList()
)

data class CellularState(
    val slots: List<SimSlotInfo> = emptyList(),
    val selectedSlotIndex: Int = 0,
    val currentNetworkType: String = "4G LTE / 5G NR",
    val currentPreferredMode: NetworkModeLock = NetworkModeLock.MODE_AUTO,
    val smscNumber: String = "",
    val btsInfo: BtsCellData? = null
)

