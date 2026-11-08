package vn.tp.radiointelligence.core.nativebridge

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RadioNativeBridgeTest {

    @Test
    fun testTimingAdvanceDistance() {
        val lteDist = RadioNativeBridge.calculateTimingAdvanceDistance(4, 0)
        assertEquals(312.5, lteDist, 0.1)

        val gsmDist = RadioNativeBridge.calculateTimingAdvanceDistance(2, 1)
        assertEquals(1100.0, gsmDist, 0.1)

        val zeroDist = RadioNativeBridge.calculateTimingAdvanceDistance(0, 0)
        assertEquals(0.0, zeroDist, 0.001)
    }

    @Test
    fun testNodeIdCalculation() {
        // LTE: Cell ID = 2412801 -> eNB = 2412801 / 256 = 9425, Sec = 2412801 % 256 = 1
        val lteNode = RadioNativeBridge.calculateNodeId(2412801L, 0)
        assertTrue(lteNode.contains("eNodeB 9425"))
        assertTrue(lteNode.contains("Sec 1"))

        // NR: Cell ID = 426803201L -> gNB = 426803201 / 4096 = 104200, Sec = 426803201 % 4096 = 1
        val nrNode = RadioNativeBridge.calculateNodeId(426803201L, 2)
        assertTrue(nrNode.contains("gNodeB 104200"))
        assertTrue(nrNode.contains("Sec 1"))
    }

    @Test
    fun testBandNameCalculation() {
        // LTE B3 (1800 MHz) EARFCN 1650
        val b3 = RadioNativeBridge.calculateBandName(1650, false)
        assertTrue(b3.contains("B3"))
        assertTrue(b3.contains("1800 MHz"))

        // NR n78 (3500 MHz) NR-ARFCN 630000
        val n78 = RadioNativeBridge.calculateBandName(630000, true)
        assertTrue(n78.contains("n78"))
        assertTrue(n78.contains("3500 MHz"))
    }

    @Test
    fun testSmscPduFormatting() {
        val formatted = RadioNativeBridge.formatSmscPdu("+84980000015")
        assertEquals("\"+84980000015\",145", formatted)

        val national = RadioNativeBridge.formatSmscPdu("0980000015")
        assertEquals("\"0980000015\",129", national)
    }

    @Test
    fun testBleDistanceCalculation() {
        val dist1m = RadioNativeBridge.calculateBleDistance(rssi = -59, txPower = -59)
        assertEquals(1.0, dist1m, 0.05)

        val distNear = RadioNativeBridge.calculateBleDistance(rssi = -50, txPower = -59)
        assertTrue(distNear < 1.0)
    }

    @Test
    fun testGnssPolarProjection() {
        // Overhead satellite: elevation 90 deg -> center (0, 0)
        val zenith = RadioNativeBridge.projectGnssPolar(elevation = 90f, azimuth = 0f, radius = 100f)
        assertEquals(0f, zenith[0], 0.01f)
        assertEquals(0f, zenith[1], 0.01f)

        // Horizon satellite: elevation 0 deg -> distance = radius
        val horizon = RadioNativeBridge.projectGnssPolar(elevation = 0f, azimuth = 90f, radius = 100f)
        // Azimuth 90 deg is East: (x = 100, y = 0)
        assertEquals(100f, horizon[0], 0.1f)
        assertEquals(0f, horizon[1], 0.1f)
    }
}
