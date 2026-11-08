package vn.tp.radiointelligence.domain.model

data class WifiState(
    val isConnected: Boolean = false,
    val ssid: String = "<Chưa kết nối>",
    val bssid: String = "--:--:--:--:--:--",
    val frequencyMhz: Int = 0,
    val wifiStandard: String = "Wi-Fi 7 (802.11be)",
    val channelWidthMhz: Int = 160,
    val linkSpeedMbps: Int = 0,
    val rssiDbm: Int = 0,
    val isMloSupported: Boolean = true,
    val isMloActive: Boolean = false,
    val mloAffiliatedLinks: List<String> = emptyList(),
    val pingResults: Map<String, Int> = emptyMap() // "Gateway" to 4ms, "Google" to 15ms, etc.
)

