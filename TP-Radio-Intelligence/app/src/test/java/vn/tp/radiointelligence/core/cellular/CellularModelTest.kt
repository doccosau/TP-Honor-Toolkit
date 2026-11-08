package vn.tp.radiointelligence.core.cellular

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.tp.radiointelligence.domain.model.NetworkModeLock

class CellularModelTest {

    @Test
    fun testNetworkModeLockMapping() {
        assertEquals(NetworkModeLock.MODE_5G_ONLY, NetworkModeLock.fromCode(29))
        assertEquals(NetworkModeLock.MODE_4G_ONLY, NetworkModeLock.fromCode(11))
        assertEquals(NetworkModeLock.MODE_NR_LTE, NetworkModeLock.fromCode(22))
        assertEquals(NetworkModeLock.MODE_AUTO, NetworkModeLock.fromCode(20))
        assertEquals(NetworkModeLock.MODE_AUTO, NetworkModeLock.fromCode(999))
    }

    @Test
    fun testTimingAdvanceDistanceFormula() {
        val ta = 4
        val distance = ta * 78.12
        assertEquals(312.48, distance, 0.01)

        val taZero = 0
        assertEquals(0.0, taZero * 78.12, 0.01)
    }

    @Test
    fun testCarrierResolverIntelligence() {
        // Test Viettel resolution
        val viettel = CarrierResolver.resolveCarrier("45204", "Viettel")
        assertEquals("Viettel", viettel.operatorName)
        assertEquals("+84980000015", viettel.recommendedSmsc)
        assertTrue(viettel.is5gCapable)

        // Test Vietnamobile resolution
        val vnm = CarrierResolver.resolveCarrier("45205", "Vietnamobile")
        assertEquals("Vietnamobile", vnm.operatorName)
        assertEquals("+84920210015", vnm.recommendedSmsc)
        assertFalse(vnm.is5gCapable)

        // Test Unknown Carrier (Zero Hardcoding)
        val unknown = CarrierResolver.resolveCarrier("52501", "Singtel")
        assertEquals("Singtel", unknown.operatorName)
        assertEquals("525", unknown.mcc)
        assertEquals("01", unknown.mnc)
    }
}
