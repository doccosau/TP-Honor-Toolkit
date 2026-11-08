package vn.tp.radiointelligence.core.cellular

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import vn.tp.radiointelligence.domain.model.BtsCellData
import vn.tp.radiointelligence.domain.model.NetworkModeLock
import vn.tp.radiointelligence.domain.model.SimSlotInfo

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
    fun testSimSlotDynamicProperties() {
        val sim = SimSlotInfo(
            slotIndex = 0,
            subId = 1,
            carrierName = "Viettel",
            displayName = "Viettel 5G",
            isDataActive = true,
            mccMnc = "45204",
            countryIso = "VN",
            signalLevel = 4,
            signalDbm = -78,
            currentSmscOnSim = "+84980000015"
        )

        assertEquals("Viettel", sim.carrierName)
        assertEquals("45204", sim.mccMnc)
        assertEquals("VN", sim.countryIso)
        assertEquals(4, sim.signalLevel)
        assertEquals(-78, sim.signalDbm)
        assertEquals("+84980000015", sim.currentSmscOnSim)
    }

    @Test
    fun testBtsCellDataCarrierAggregation() {
        val bts = BtsCellData(
            cellType = "4G LTE",
            pci = 120,
            arfcn = 1800,
            bandName = "B3 (1800 MHz)",
            rsrp = -82,
            rsrq = -8,
            sinr = 22,
            timingAdvance = 2,
            distanceMeters = 156.24,
            isCarrierAggregation = true,
            secondaryBands = listOf("B1 (2100 MHz)", "B7 (2600 MHz)")
        )

        assertEquals(true, bts.isCarrierAggregation)
        assertEquals(2, bts.secondaryBands.size)
        assertEquals(156.24, bts.distanceMeters, 0.01)
    }
}
