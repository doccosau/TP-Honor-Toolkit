package vn.tp.radiointelligence.core.gnss

import android.annotation.SuppressLint
import android.content.Context
import android.location.GnssStatus
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import vn.tp.radiointelligence.core.shizuku.ShizukuBridge
import vn.tp.radiointelligence.domain.model.GnssState
import vn.tp.radiointelligence.domain.model.SatelliteInfo

class GnssController(
    private val context: Context,
    private val shizukuBridge: ShizukuBridge
) {
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    private val _gnssState = MutableStateFlow(GnssState())
    val gnssState: StateFlow<GnssState> = _gnssState.asStateFlow()

    private var isTracking = false

    private val gnssStatusCallback = object : GnssStatus.Callback() {
        override fun onSatelliteStatusChanged(status: GnssStatus) {
            val count = status.satelliteCount
            val satList = mutableListOf<SatelliteInfo>()
            var usedCount = 0
            var beidouCount = 0
            var gpsCount = 0
            var dualFreqCount = 0

            for (i in 0 until count) {
                val svid = status.getSvid(i)
                val constellationType = status.getConstellationType(i)
                val cn0 = status.getCn0DbHz(i)
                val elevation = status.getElevationDegrees(i)
                val azimuth = status.getAzimuthDegrees(i)
                val used = status.usedInFix(i)
                val hasFreq = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) status.hasCarrierFrequencyHz(i) else false
                val carrierFreq = if (hasFreq && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    status.getCarrierFrequencyHz(i).toDouble()
                } else 0.0

                val (constellationName, isDual) = parseConstellation(constellationType, carrierFreq)

                if (used) usedCount++
                if (constellationName == "BeiDou") beidouCount++
                if (constellationName == "GPS") gpsCount++
                if (isDual) dualFreqCount++

                satList.add(
                    SatelliteInfo(
                        svid = svid,
                        constellation = constellationName,
                        cn0DbHz = cn0,
                        elevationDegrees = elevation,
                        azimuthDegrees = azimuth,
                        usedInFix = used,
                        carrierFreqHz = carrierFreq,
                        isDualFrequency = isDual
                    )
                )
            }

            _gnssState.value = _gnssState.value.copy(
                satellites = satList.sortedByDescending { it.cn0DbHz },
                totalSatellites = count,
                usedSatellites = usedCount,
                beidouCount = beidouCount,
                gpsCount = gpsCount,
                dualFreqCount = dualFreqCount
            )
        }
    }

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(loc: Location) {
            _gnssState.value = _gnssState.value.copy(
                isFixAcquired = true,
                latitude = loc.latitude,
                longitude = loc.longitude,
                altitudeMeters = loc.altitude,
                speedKmh = loc.speed * 3.6f,
                accuracyMeters = loc.accuracy
            )
        }

        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {
            _gnssState.value = _gnssState.value.copy(isFixAcquired = false)
        }
    }

    @SuppressLint("MissingPermission")
    fun startTracking() {
        if (isTracking) return
        try {
            locationManager.registerGnssStatusCallback(gnssStatusCallback, null)
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                1000L,
                0f,
                locationListener,
                Looper.getMainLooper()
            )
            isTracking = true
        } catch (_: SecurityException) {
            // Keep empty state, NO MOCK DATA
        } catch (_: Throwable) {
        }
    }

    fun stopTracking() {
        if (!isTracking) return
        try {
            locationManager.unregisterGnssStatusCallback(gnssStatusCallback)
            locationManager.removeUpdates(locationListener)
        } catch (_: Throwable) {}
        isTracking = false
    }

    suspend fun accelerateGpsLock(): Boolean = withContext(Dispatchers.IO) {
        var success = false

        // 1. Android LocationManager Extra Commands
        try {
            val bundle = Bundle().apply { putBoolean("all", true) }
            locationManager.sendExtraCommand(LocationManager.GPS_PROVIDER, "delete_aiding_data", bundle)
            locationManager.sendExtraCommand(LocationManager.GPS_PROVIDER, "force_xtra_injection", null)
            locationManager.sendExtraCommand(LocationManager.GPS_PROVIDER, "force_time_injection", null)
            success = true
        } catch (_: Throwable) {
        }

        // 2. Privileged Shell Commands via Shizuku
        try {
            shizukuBridge.executeShellCommand("cmd location send-extra-command gps delete_aiding_data")
            shizukuBridge.executeShellCommand("cmd location send-extra-command gps force_xtra_injection")
            shizukuBridge.executeShellCommand("cmd location send-extra-command gps force_time_injection")
            success = true
        } catch (_: Throwable) {
        }

        success
    }

    private fun parseConstellation(type: Int, freq: Double): Pair<String, Boolean> {
        val freqMhz = freq / 1_000_000.0
        return when (type) {
            GnssStatus.CONSTELLATION_BEIDOU -> {
                val isB2a = freqMhz in 1166.0..1186.0
                "BeiDou" to isB2a
            }
            GnssStatus.CONSTELLATION_GPS -> {
                val isL5 = freqMhz in 1166.0..1186.0
                "GPS" to isL5
            }
            GnssStatus.CONSTELLATION_GALILEO -> {
                val isE5 = freqMhz in 1166.0..1215.0
                "Galileo" to isE5
            }
            GnssStatus.CONSTELLATION_GLONASS -> "GLONASS" to false
            GnssStatus.CONSTELLATION_QZSS -> {
                val isL5 = freqMhz in 1166.0..1186.0
                "QZSS" to isL5
            }
            else -> "Khác" to false
        }
    }
}
