package vn.tp.radiointelligence.domain.model

data class SatelliteInfo(
    val svid: Int,
    val constellation: String, // BeiDou, GPS, Galileo, GLONASS, QZSS
    val cn0DbHz: Float,
    val elevationDegrees: Float,
    val azimuthDegrees: Float,
    val usedInFix: Boolean,
    val carrierFreqHz: Double,
    val isDualFrequency: Boolean
)

data class GnssState(
    val isFixAcquired: Boolean = false,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val altitudeMeters: Double = 0.0,
    val speedKmh: Float = 0.0f,
    val accuracyMeters: Float = 0.0f,
    val satellites: List<SatelliteInfo> = emptyList(),
    val totalSatellites: Int = 0,
    val usedSatellites: Int = 0,
    val beidouCount: Int = 0,
    val gpsCount: Int = 0,
    val dualFreqCount: Int = 0
)

