package vn.tp.radiointelligence.core.bluetooth

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.pow

class BluetoothDistanceTest {

    private fun calculateDistance(rssi: Int, txPower: Int = -59): Double {
        if (rssi == 0) return -1.0
        val ratio = (txPower - rssi) / (10.0 * 2.5)
        val dist = 10.0.pow(ratio)
        return kotlin.math.round(dist * 10.0) / 10.0
    }

    @Test
    fun testRssiAt1Meter() {
        val dist = calculateDistance(rssi = -59, txPower = -59)
        assertEquals(1.0, dist, 0.05)
    }

    @Test
    fun testRssiNearDistance() {
        // Closer than 1 meter: RSSI > -59 dBm
        val dist = calculateDistance(rssi = -52, txPower = -59)
        assertTrue(dist < 1.0)
    }

    @Test
    fun testRssiFarDistance() {
        // Farther than 1 meter: RSSI < -59 dBm
        val dist = calculateDistance(rssi = -75, txPower = -59)
        assertTrue(dist > 1.0)
    }
}

