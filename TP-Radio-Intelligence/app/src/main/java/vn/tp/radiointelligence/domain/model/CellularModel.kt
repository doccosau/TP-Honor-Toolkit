package vn.tp.radiointelligence.domain.model

import vn.tp.radiointelligence.core.cellular.CarrierDetails

data class SimSlotInfo(
    val slotIndex: Int,
    val subId: Int,
    val carrierName: String,
    val displayName: String,
    val isDataActive: Boolean,
    val mccMnc: String = "",
    val signalLevel: Int = 0, // 0..4 bars
    val signalDbm: Int = -105,
    val recommendedSmsc: String = "",
    val carrierDetails: CarrierDetails = CarrierDetails("SIM", "", "", "", true)
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
    val cellType: String = "4G LTE",
    val pci: Int = 0,
    val arfcn: Int = 0,
    val bandName: String = "B3 (1800 MHz)",
    val rsrp: Int = -95,
    val rsrq: Int = -10,
    val sinr: Int = 12,
    val timingAdvance: Int = 0,
    val distanceMeters: Double = 0.0,
    val isCarrierAggregation: Boolean = false,
    val secondaryBands: List<String> = emptyList()
)

data class CellularState(
    val slots: List<SimSlotInfo> = emptyList(),
    val selectedSlotIndex: Int = 0,
    val currentNetworkType: String = "Chưa kết nối",
    val currentPreferredMode: NetworkModeLock = NetworkModeLock.MODE_AUTO,
    val smscNumber: String = "",
    val btsInfo: BtsCellData? = null,
    val hardware5gSupported: Boolean = true,
    val smartRecommendationReason: String = ""
)
