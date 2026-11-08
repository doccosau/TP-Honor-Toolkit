package vn.tp.radiointelligence.core.cellular

import org.junit.Assert.assertEquals
import org.junit.Test
import vn.tp.radiointelligence.domain.model.NetworkModeLock

class CellularModelTest {

    @Test
    fun testNetworkModeLockMapping() {
        assertEquals(NetworkModeLock.MODE_5G_ONLY, NetworkModeLock.fromCode(29))
        assertEquals(NetworkModeLock.MODE_4G_ONLY, NetworkModeLock.fromCode(11))
        assertEquals(NetworkModeLock.MODE_NR_LTE, NetworkModeLock.fromCode(22))
        assertEquals(NetworkModeLock.MODE_AUTO, NetworkModeLock.fromCode(20))
        assertEquals(NetworkModeLock.MODE_AUTO, NetworkModeLock.fromCode(999)) // Unknown code fallback
    }

    @Test
    fun testTimingAdvanceDistanceFormula() {
        val ta = 4
        val distance = ta * 78.12
        assertEquals(312.48, distance, 0.01)

        val taZero = 0
        assertEquals(0.0, taZero * 78.12, 0.01)
    }
}

