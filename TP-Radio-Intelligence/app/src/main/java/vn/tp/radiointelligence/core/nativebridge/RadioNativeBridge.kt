package vn.tp.radiointelligence.core.nativebridge

import android.util.Log

/**
 * High-Performance Native Bridge to Rust libradio_core.so
 * Executes 3GPP calculations, Kalman/EMA RF filters, and PDU formatting at native speed.
 */
object RadioNativeBridge {

    private const val TAG = "RadioNativeBridge"

    var isNativeLoaded: Boolean = false
        private set

    init {
        try {
            System.loadLibrary("radio_core")
            isNativeLoaded = true
            nativeInit()
            Log.i(TAG, "Successfully loaded native Rust radio_core engine!")
        } catch (t: Throwable) {
            isNativeLoaded = false
            Log.w(TAG, "Native radio_core library not available, falling back to pure Kotlin: ${t.message}")
        }
    }

    // --- Native JNI Declarations ---
    private external fun nativeInit(): Boolean
    private external fun nativeFilterRsrp(rawDbm: Float): Float
    private external fun nativeCalculateTimingAdvanceDistance(ta: Int, ratType: Int): Double
    private external fun nativeCalculateNodeId(ci: Long, ratType: Int): String
    private external fun nativeCalculateBandName(arfcn: Int, isNr: Boolean): String
    private external fun nativeFormatSmscPdu(phoneNumber: String): String
    private external fun nativeProjectGnssPolar(elevation: Float, azimuth: Float, radius: Float): FloatArray
    private external fun nativeCalculateBleDistance(rssi: Int, txPower: Int, pathLossExponent: Float): Double

    // --- High-Level Safe Public API with Resilient Fallback ---

    fun filterRsrp(rawDbm: Float): Float {
        return if (isNativeLoaded) {
            try {
                nativeFilterRsrp(rawDbm)
            } catch (_: Throwable) {
                rawDbm
            }
        } else {
            rawDbm
        }
    }

    fun calculateTimingAdvanceDistance(ta: Int, ratType: Int): Double {
        return if (isNativeLoaded) {
            try {
                nativeCalculateTimingAdvanceDistance(ta, ratType)
            } catch (_: Throwable) {
                fallbackTaDistance(ta, ratType)
            }
        } else {
            fallbackTaDistance(ta, ratType)
        }
    }

    fun calculateNodeId(ci: Long, ratType: Int): String {
        return if (isNativeLoaded) {
            try {
                nativeCalculateNodeId(ci, ratType)
            } catch (_: Throwable) {
                fallbackNodeId(ci, ratType)
            }
        } else {
            fallbackNodeId(ci, ratType)
        }
    }

    fun calculateBandName(arfcn: Int, isNr: Boolean): String {
        return if (isNativeLoaded) {
            try {
                nativeCalculateBandName(arfcn, isNr)
            } catch (_: Throwable) {
                fallbackBandName(arfcn, isNr)
            }
        } else {
            fallbackBandName(arfcn, isNr)
        }
    }

    fun formatSmscPdu(phoneNumber: String): String {
        return if (isNativeLoaded) {
            try {
                nativeFormatSmscPdu(phoneNumber)
            } catch (_: Throwable) {
                fallbackFormatSmscPdu(phoneNumber)
            }
        } else {
            fallbackFormatSmscPdu(phoneNumber)
        }
    }

    fun projectGnssPolar(elevation: Float, azimuth: Float, radius: Float): FloatArray {
        return if (isNativeLoaded) {
            try {
                nativeProjectGnssPolar(elevation, azimuth, radius)
            } catch (_: Throwable) {
                fallbackProjectPolar(elevation, azimuth, radius)
            }
        } else {
            fallbackProjectPolar(elevation, azimuth, radius)
        }
    }

    fun calculateBleDistance(rssi: Int, txPower: Int = -59, pathLossExponent: Float = 2.4f): Double {
        return if (isNativeLoaded) {
            try {
                nativeCalculateBleDistance(rssi, txPower, pathLossExponent)
            } catch (_: Throwable) {
                fallbackBleDistance(rssi, txPower, pathLossExponent)
            }
        } else {
            fallbackBleDistance(rssi, txPower, pathLossExponent)
        }
    }

    // --- Kotlin Fallbacks for Testing / Fallback Mode ---

    private fun fallbackTaDistance(ta: Int, ratType: Int): Double {
        if (ta <= 0) return 0.0
        return when (ratType) {
            1 -> ta * 550.0 // GSM
            else -> ta * 78.125 // LTE / NR
        }
    }

    private fun fallbackNodeId(ci: Long, ratType: Int): String {
        if (ci <= 0) return "N/A"
        return if (ratType == 2 && ci < 68719476735L) {
            "gNodeB ${ci / 4096} • Sec ${ci % 4096}"
        } else if (ci in 1..268435455) {
            "eNodeB ${ci / 256} • Sec ${ci % 256}"
        } else {
            "Cell ID $ci"
        }
    }

    private fun fallbackBandName(arfcn: Int, isNr: Boolean): String {
        return if (isNr) {
            when (arfcn) {
                in 422000..434000 -> "n1 (2100 MHz FDD)"
                in 361000..376000 -> "n3 (1800 MHz FDD)"
                in 140000..156000 -> "n28 (700 MHz APT)"
                in 499200..537999 -> "n41 (2500 MHz TDD)"
                in 620000..653333 -> "n78 (3500 MHz C-Band)"
                in 653334..680000 -> "n77 (3700 MHz C-Band)"
                in 693333..733333 -> "n79 (4700 MHz TDD)"
                else -> "5G NR ARFCN $arfcn"
            }
        } else {
            when (arfcn) {
                in 0..599 -> "B1 (2100 MHz FDD)"
                in 600..1199 -> "B2 (1900 MHz FDD)"
                in 1200..1949 -> "B3 (1800 MHz FDD)"
                in 1950..2399 -> "B4 (AWS-1 1700/2100 MHz)"
                in 2400..2649 -> "B5 (850 MHz FDD)"
                in 2750..3449 -> "B7 (2600 MHz FDD)"
                in 3450..3799 -> "B8 (900 MHz FDD)"
                in 6150..6449 -> "B20 (800 MHz DD)"
                in 9210..9659 -> "B28 (700 MHz APT)"
                in 37750..38249 -> "B38 (2600 MHz TDD)"
                in 38650..39649 -> "B40 (2300 MHz TDD)"
                in 39650..41589 -> "B41 (2500 MHz BRS/EBS TDD)"
                else -> "LTE EARFCN $arfcn"
            }
        }
    }

    private fun fallbackFormatSmscPdu(phoneNumber: String): String {
        val cleaned = phoneNumber.filter { it.isDigit() || it == '+' }
        if (cleaned.isBlank()) return ""
        return if (cleaned.startsWith("+")) "\"$cleaned\",145" else "\"$cleaned\",129"
    }

    private fun fallbackProjectPolar(elevation: Float, azimuth: Float, radius: Float): FloatArray {
        val clampedElev = elevation.coerceIn(0f, 90f)
        val r = radius * (1f - (clampedElev / 90f))
        val azRad = Math.toRadians((azimuth - 90.0)).toFloat()
        return floatArrayOf(
            r * kotlin.math.cos(azRad),
            r * kotlin.math.sin(azRad)
        )
    }

    private fun fallbackBleDistance(rssi: Int, txPower: Int, pathLossExponent: Float): Double {
        if (rssi == 0) return -1.0
        val n = if (pathLossExponent <= 0f) 2.4 else pathLossExponent.toDouble()
        val ratio = (txPower - rssi).toDouble() / (10.0 * n)
        return Math.pow(10.0, ratio)
    }
}
