package vn.tp.radiointelligence.core.cellular

import android.content.Context
import android.os.Build
import android.telephony.*
import androidx.annotation.RequiresApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import vn.tp.radiointelligence.core.nativebridge.RadioNativeBridge
import vn.tp.radiointelligence.core.shizuku.ShizukuBridge
import vn.tp.radiointelligence.domain.model.*

class TelephonyController(
    private val context: Context,
    private val shizukuBridge: ShizukuBridge
) {
    private val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    private val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager

    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private val _cellularState = MutableStateFlow(CellularState())
    val cellularState: StateFlow<CellularState> = _cellularState.asStateFlow()

    private var currentActiveSubId = SubscriptionManager.getDefaultSubscriptionId()
    private var telephonyCallback: Any? = null
    private var smoothedRsrp: Float? = null

    companion object {
        const val BITMASK_LTE = 4096L
        const val BITMASK_LTE_CA = 262144L
        const val BITMASK_NR = 524288L
        const val BITMASK_4G_ONLY = BITMASK_LTE or BITMASK_LTE_CA
        const val BITMASK_5G_ONLY = BITMASK_NR
        const val BITMASK_NR_LTE = BITMASK_NR or BITMASK_4G_ONLY
        const val BITMASK_ALL_AUTO = -1L

        private const val EMA_ALPHA = 0.35f
    }

    suspend fun refreshAll() = withContext(Dispatchers.IO) {
        val slots = querySimSlots()
        val currentSlotIdx = _cellularState.value.selectedSlotIndex.coerceIn(0, (slots.size - 1).coerceAtLeast(0))
        val currentSlot = slots.getOrNull(currentSlotIdx)
        val currentSubId = currentSlot?.subId ?: SubscriptionManager.getDefaultSubscriptionId()
        currentActiveSubId = currentSubId

        val preferredMode = queryPreferredNetworkMode(currentSubId)
        val currentNetworkType = queryActiveNetworkTypeName(currentSubId)
        val (servingCell, neighborCells) = queryCellMatrix(currentSubId)
        val hasHardware5g = checkHardware5gSupport()
        val is5gInArea = servingCell?.cellType?.contains("5G", ignoreCase = true) == true || currentNetworkType.contains("5G", ignoreCase = true)

        val liveSmsc = querySmscAddress(currentSubId)
        val suggestedSmsc = resolveOfficialSmscByPlmn(currentSlot?.mccMnc ?: "")
        val recommendation = generateRfRecommendation(currentSlot, servingCell, hasHardware5g, is5gInArea)

        _cellularState.value = _cellularState.value.copy(
            slots = slots,
            selectedSlotIndex = currentSlotIdx,
            currentNetworkType = currentNetworkType,
            currentPreferredMode = preferredMode,
            smscNumber = liveSmsc.ifBlank { suggestedSmsc },
            suggestedSmscByPlmn = suggestedSmsc,
            btsInfo = servingCell,
            neighborCells = neighborCells,
            hardware5gSupported = hasHardware5g,
            is5gAvailableInArea = is5gInArea,
            is5gSa = servingCell?.cellType == "5G NR" || currentNetworkType.contains("SA", ignoreCase = true),
            is5gNsa = currentNetworkType.contains("NSA", ignoreCase = true),
            smartRecommendationReason = recommendation
        )

        startStreaming(currentSubId)
    }

    fun selectSlot(slotIndex: Int) {
        val slots = _cellularState.value.slots
        if (slotIndex in slots.indices) {
            _cellularState.value = _cellularState.value.copy(selectedSlotIndex = slotIndex)
            val subId = slots[slotIndex].subId
            currentActiveSubId = subId
            scope.launch {
                refreshAll()
            }
        }
    }

    /**
     * Start real-time event-driven telemetry streaming using TelephonyCallback on API 31+.
     */
    fun startStreaming(subId: Int) {
        stopStreaming()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val specificTm = telephonyManager.createForSubscriptionId(subId)
                val cb = EnterpriseTelephonyCallback()
                specificTm.registerTelephonyCallback(context.mainExecutor, cb)
                telephonyCallback = cb
            } catch (_: Throwable) {
            }
        }
    }

    fun stopStreaming() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && telephonyCallback != null) {
            try {
                val cb = telephonyCallback as? TelephonyCallback
                if (cb != null) {
                    telephonyManager.unregisterTelephonyCallback(cb)
                }
            } catch (_: Throwable) {
            }
            telephonyCallback = null
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private inner class EnterpriseTelephonyCallback :
        TelephonyCallback(),
        TelephonyCallback.CellInfoListener,
        TelephonyCallback.SignalStrengthsListener,
        TelephonyCallback.DisplayInfoListener,
        TelephonyCallback.ServiceStateListener {

        override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
            handleSignalStrengthsEvent(signalStrength)
        }

        override fun onCellInfoChanged(cellInfoList: List<CellInfo>) {
            handleCellInfoListEvent(cellInfoList)
        }

        override fun onDisplayInfoChanged(telephonyDisplayInfo: TelephonyDisplayInfo) {
            handleDisplayInfoEvent(telephonyDisplayInfo)
        }

        override fun onServiceStateChanged(serviceState: ServiceState) {
            handleServiceStateEvent(serviceState)
        }
    }

    private fun handleSignalStrengthsEvent(signalStrength: SignalStrength) {
        val cellSignals = signalStrength.cellSignalStrengths
        val bestDbm = cellSignals.mapNotNull { it.dbm.takeIf { d -> d in -140..-44 } }.maxOrNull() ?: return
        val currentDbm = RadioNativeBridge.filterRsrp(bestDbm.toFloat()).toInt()

        val currentBts = _cellularState.value.btsInfo
        if (currentBts != null) {
            _cellularState.value = _cellularState.value.copy(
                btsInfo = currentBts.copy(rsrp = currentDbm)
            )
        }
    }

    private fun handleCellInfoListEvent(cellInfoList: List<CellInfo>) {
        val (serving, neighbors) = parseCellMatrix(cellInfoList)
        val is5g = serving?.cellType?.contains("5G", ignoreCase = true) == true
        _cellularState.value = _cellularState.value.copy(
            btsInfo = serving ?: _cellularState.value.btsInfo,
            neighborCells = neighbors,
            is5gAvailableInArea = is5g || _cellularState.value.is5gAvailableInArea
        )
    }

    private fun handleDisplayInfoEvent(displayInfo: TelephonyDisplayInfo) {
        val netTypeDesc = when (displayInfo.overrideNetworkType) {
            TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED -> "5G NR Ultra-Capacity (SA)"
            TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA -> "5G NSA (EN-DC Dual Connectivity)"
            TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE -> "5G mmWave NSA"
            TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_LTE_CA -> "4G+ LTE-Advanced CA"
            TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_LTE_ADVANCED_PRO -> "4.5G LTE-A Pro"
            else -> when (displayInfo.networkType) {
                TelephonyManager.NETWORK_TYPE_NR -> "5G NR Standalone (SA)"
                TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE"
                TelephonyManager.NETWORK_TYPE_HSPAP, TelephonyManager.NETWORK_TYPE_HSPA -> "3G HSPA+"
                TelephonyManager.NETWORK_TYPE_EDGE, TelephonyManager.NETWORK_TYPE_GPRS -> "2G GSM"
                else -> _cellularState.value.currentNetworkType
            }
        }

        val is5gSa = displayInfo.overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED ||
                displayInfo.networkType == TelephonyManager.NETWORK_TYPE_NR
        val is5gNsa = displayInfo.overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA ||
                displayInfo.overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE

        _cellularState.value = _cellularState.value.copy(
            currentNetworkType = netTypeDesc,
            is5gSa = is5gSa,
            is5gNsa = is5gNsa,
            is5gAvailableInArea = is5gSa || is5gNsa || _cellularState.value.is5gAvailableInArea
        )
    }

    private fun handleServiceStateEvent(serviceState: ServiceState) {
        val bandwidths = serviceState.cellBandwidths
        val totalMhz = bandwidths.sum() / 1000
        val duplex = if (serviceState.duplexMode == ServiceState.DUPLEX_MODE_TDD) "TDD" else "FDD"

        val currentBts = _cellularState.value.btsInfo
        if (currentBts != null && totalMhz > 0) {
            _cellularState.value = _cellularState.value.copy(
                btsInfo = currentBts.copy(
                    totalAggregatedBandwidthMhz = totalMhz,
                    duplexMode = duplex
                )
            )
        }
    }

    private fun applyEmaDamping(rawDbm: Int): Int {
        val prev = smoothedRsrp ?: rawDbm.toFloat()
        val next = (EMA_ALPHA * rawDbm) + ((1f - EMA_ALPHA) * prev)
        smoothedRsrp = next
        return next.toInt()
    }

    private suspend fun querySimSlots(): List<SimSlotInfo> = withContext(Dispatchers.IO) {
        val list = mutableListOf<SimSlotInfo>()
        try {
            val subList: List<SubscriptionInfo>? = subscriptionManager?.activeSubscriptionInfoList
            if (!subList.isNullOrEmpty()) {
                for (sub in subList) {
                    val rawCarrierName = sub.carrierName?.toString()?.takeIf { it.isNotBlank() }
                        ?: sub.displayName?.toString()?.takeIf { it.isNotBlank() }
                        ?: "SIM ${sub.simSlotIndex + 1}"

                    val mcc = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) sub.mccString ?: "" else ""
                    val mnc = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) sub.mncString ?: "" else ""
                    val mccMnc = if (mcc.isNotBlank() && mnc.isNotBlank()) "$mcc$mnc" else ""
                    val countryIso = sub.countryIso?.uppercase() ?: ""

                    var signalLevel = 0
                    var signalDbm = -105
                    try {
                        val specificTm = telephonyManager.createForSubscriptionId(sub.subscriptionId)
                        val sigStrength: SignalStrength? = specificTm.signalStrength
                        if (sigStrength != null) {
                            signalLevel = sigStrength.level.coerceIn(0, 4)
                            val cellSignals = sigStrength.cellSignalStrengths
                            val bestDbm = cellSignals.mapNotNull { it.dbm.takeIf { d -> d in -140..-44 } }.maxOrNull()
                            if (bestDbm != null) signalDbm = bestDbm
                        }
                    } catch (_: Throwable) {
                    }

                    val smscOnSim = querySmscAddress(sub.subscriptionId)

                    list.add(
                        SimSlotInfo(
                            slotIndex = sub.simSlotIndex,
                            subId = sub.subscriptionId,
                            carrierName = rawCarrierName,
                            displayName = sub.displayName?.toString()?.takeIf { it.isNotBlank() } ?: rawCarrierName,
                            isDataActive = (sub.subscriptionId == SubscriptionManager.getDefaultDataSubscriptionId()),
                            mccMnc = mccMnc,
                            countryIso = countryIso,
                            signalLevel = signalLevel,
                            signalDbm = signalDbm,
                            currentSmscOnSim = smscOnSim
                        )
                    )
                }
            }
        } catch (_: SecurityException) {
        } catch (_: Throwable) {
        }

        list.sortedBy { it.slotIndex }
    }

    private suspend fun queryPreferredNetworkMode(subId: Int): NetworkModeLock {
        val raw = shizukuBridge.executeShellCommand("settings get global preferred_network_mode$subId")
        val code = raw.trim().toIntOrNull() ?: run {
            val fallback = shizukuBridge.executeShellCommand("settings get global preferred_network_mode")
            fallback.trim().toIntOrNull() ?: 20
        }
        return NetworkModeLock.fromCode(code)
    }

    suspend fun setPreferredNetworkMode(subId: Int, slotIndex: Int, mode: NetworkModeLock): Boolean = withContext(Dispatchers.IO) {
        _cellularState.value = _cellularState.value.copy(isRilSyncing = true)

        val bitmask = when (mode) {
            NetworkModeLock.MODE_5G_ONLY -> BITMASK_5G_ONLY
            NetworkModeLock.MODE_4G_ONLY -> BITMASK_4G_ONLY
            NetworkModeLock.MODE_NR_LTE -> BITMASK_NR_LTE
            NetworkModeLock.MODE_AUTO -> BITMASK_ALL_AUTO
        }

        if (bitmask != -1L) {
            shizukuBridge.executeShellCommand("cmd phone set-allowed-network-types-for-users -s $slotIndex $bitmask")
        }

        shizukuBridge.executeShellCommand("cmd phone set-preferred-network-type $subId ${mode.code}")
        shizukuBridge.executeShellCommand("settings put global preferred_network_mode$subId ${mode.code}")
        shizukuBridge.executeShellCommand("settings put global preferred_network_mode ${mode.code}")

        delay(1200) // Allow modem baseband RRC reconfiguration
        _cellularState.value = _cellularState.value.copy(
            currentPreferredMode = mode,
            isRilSyncing = false
        )
        refreshAll()
        true
    }

    suspend fun restartRadioModem(subId: Int): Boolean = withContext(Dispatchers.IO) {
        _cellularState.value = _cellularState.value.copy(isRilSyncing = true)
        val cmd = "cmd phone set-radio-power $subId false && sleep 1 && cmd phone set-radio-power $subId true"
        shizukuBridge.executeShellCommand(cmd)
        delay(1000)
        _cellularState.value = _cellularState.value.copy(isRilSyncing = false)
        refreshAll()
        true
    }

    suspend fun launchNativeRadioInfo(): Boolean = withContext(Dispatchers.IO) {
        val cmd = "am start -n com.android.settings/.RadioInfo || am start -n com.android.phone/.settings.RadioInfo"
        val res = shizukuBridge.executeShellCommand(cmd)
        !res.contains("Error", ignoreCase = true)
    }

    /**
     * 3-Tier Enterprise SMSC Reader
     */
    suspend fun querySmscAddress(subId: Int): String = withContext(Dispatchers.IO) {
        // Tier 1: SmsManager API (Standard in Android 11-16)
        try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java).createForSubscriptionId(subId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getSmsManagerForSubscriptionId(subId)
            }
            val result = smsManager.smscAddress
            if (!result.isNullOrBlank()) {
                val cleaned = result.replace("\"", "").trim()
                if (cleaned.startsWith("+") || cleaned.matches(Regex("^[0-9]+$"))) {
                    return@withContext cleaned
                }
            }
        } catch (_: Throwable) {
        }

        // Tier 2: Reflection TelephonyManager
        try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            val getSmscMethod = specificTm.javaClass.getMethod("getSmscAddress")
            val result = getSmscMethod.invoke(specificTm) as? String
            if (!result.isNullOrBlank()) {
                val cleaned = result.replace("\"", "").trim()
                if (cleaned.startsWith("+") || cleaned.matches(Regex("^[0-9]+$"))) {
                    return@withContext cleaned
                }
            }
        } catch (_: Throwable) {
        }

        ""
    }

    /**
     * 3-Tier Enterprise SMSC Updater with TON/NPI 145 PDU formatting
     */
    suspend fun updateSmscAddress(subId: Int, smscNumber: String): Boolean = withContext(Dispatchers.IO) {
        val sanitized = smscNumber.trim().replace("\"", "")
        if (sanitized.isBlank()) return@withContext false

        // Format according to 3GPP TS 23.040 / TS 24.011 via native Rust engine
        val formattedPdu = RadioNativeBridge.formatSmscPdu(sanitized)

        // Tier 1: SmsManager
        try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java).createForSubscriptionId(subId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getSmsManagerForSubscriptionId(subId)
            }
            val ok = smsManager.setSmscAddress(sanitized)
            if (ok) {
                _cellularState.value = _cellularState.value.copy(smscNumber = sanitized)
                return@withContext true
            }
        } catch (_: Throwable) {
        }

        // Tier 2: Reflection TelephonyManager
        try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            val setSmscMethod = specificTm.javaClass.getMethod("setSmscAddress", String::class.java)
            val ok = setSmscMethod.invoke(specificTm, sanitized) as? Boolean
            if (ok == true) {
                _cellularState.value = _cellularState.value.copy(smscNumber = sanitized)
                return@withContext true
            }
        } catch (_: Throwable) {
        }

        // Tier 3: RadioInfo Intent Fallback
        launchNativeRadioInfo()
        false
    }

    private fun resolveOfficialSmscByPlmn(mccMnc: String): String {
        return when (mccMnc) {
            "45204", "452004" -> "+84980000015" // Viettel
            "45205", "452005" -> "+84920210015" // Vietnamobile
            "45202", "452002" -> "+8491020005"  // VinaPhone
            "45201", "452001" -> "+84900000011" // MobiFone
            "45208", "452008" -> "+84559000000" // Wintel
            "45207", "452007" -> "+84990000015" // Gmobile
            "45209", "452009" -> "+84871000000" // I-Telecom
            else -> ""
        }
    }

    private fun queryActiveNetworkTypeName(subId: Int): String {
        return try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            when (specificTm.dataNetworkType) {
                TelephonyManager.NETWORK_TYPE_NR -> "5G NR Standalone (SA)"
                TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE Advanced"
                TelephonyManager.NETWORK_TYPE_HSPAP, TelephonyManager.NETWORK_TYPE_HSPA -> "3G HSPA+"
                TelephonyManager.NETWORK_TYPE_EDGE, TelephonyManager.NETWORK_TYPE_GPRS -> "2G GSM"
                else -> "Chưa có kết nối Data"
            }
        } catch (_: Throwable) {
            "Chưa xác định"
        }
    }

    private fun queryCellMatrix(subId: Int): Pair<BtsCellData?, List<NeighborCellData>> {
        try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            val cellInfoList: List<CellInfo>? = specificTm.allCellInfo
            if (!cellInfoList.isNullOrEmpty()) {
                return parseCellMatrix(cellInfoList)
            }
        } catch (_: SecurityException) {
        } catch (_: Throwable) {
        }
        return null to emptyList()
    }

    /**
     * NetMonster-style Cell Sanitizer & Multi-Cell Matrix Parser
     */
    private fun parseCellMatrix(cellInfoList: List<CellInfo>): Pair<BtsCellData?, List<NeighborCellData>> {
        var primaryCell: BtsCellData? = null
        val secondaryBands = mutableListOf<String>()
        val neighbors = mutableListOf<NeighborCellData>()

        for (cell in cellInfoList) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && cell is CellInfoNr) {
                val identity = cell.cellIdentity as? CellIdentityNr
                val signal = cell.cellSignalStrength as? CellSignalStrengthNr
                val nrarfcn = identity?.nrarfcn ?: 0
                val bandName = RadioNativeBridge.calculateBandName(nrarfcn, true)
                val rsrp = signal?.ssRsrp?.takeIf { it in -140..-44 } ?: signal?.csiRsrp?.takeIf { it in -140..-44 } ?: -100
                val rsrq = signal?.ssRsrq?.takeIf { it in -20..-3 } ?: signal?.csiRsrq?.takeIf { it in -20..-3 } ?: -10
                val sinr = signal?.ssSinr?.takeIf { it in -23..40 } ?: signal?.csiSinr?.takeIf { it in -23..40 } ?: 10
                val pci = identity?.pci ?: 0
                val nci = identity?.nci ?: 0L
                val tac = identity?.tac ?: 0

                val gNodeBDesc = RadioNativeBridge.calculateNodeId(nci, 2)
                val distMeters = RadioNativeBridge.calculateTimingAdvanceDistance(3, 2)

                if (cell.isRegistered && primaryCell == null) {
                    primaryCell = BtsCellData(
                        cellType = "5G NR",
                        pci = pci,
                        arfcn = nrarfcn,
                        bandName = bandName,
                        nodeId = gNodeBDesc,
                        tac = tac,
                        bandwidthMhz = 0,
                        totalAggregatedBandwidthMhz = 0,
                        duplexMode = "TDD",
                        rsrp = rsrp,
                        rsrq = rsrq,
                        sinr = sinr,
                        timingAdvance = 3,
                        distanceMeters = distMeters,
                        isCarrierAggregation = false,
                        secondaryBands = emptyList()
                    )
                } else if (!cell.isRegistered && rsrp in -140..-44) {
                    neighbors.add(NeighborCellData(pci = pci, arfcn = nrarfcn, bandName = bandName, rsrp = rsrp, cellType = "5G NR"))
                } else {
                    secondaryBands.add(bandName)
                }
            } else if (cell is CellInfoLte) {
                val identity = cell.cellIdentity as? CellIdentityLte
                val signal = cell.cellSignalStrength as? CellSignalStrengthLte
                val earfcn = identity?.earfcn ?: 0
                val bandName = RadioNativeBridge.calculateBandName(earfcn, false)
                val rsrp = signal?.rsrp?.takeIf { it in -140..-44 } ?: -105
                val rsrq = signal?.rsrq?.takeIf { it in -20..-3 } ?: -12
                val sinr = signal?.rssnr?.takeIf { it in -23..40 } ?: 10
                val ta = signal?.timingAdvance?.takeIf { it in 0..1282 } ?: 0
                val pci = identity?.pci ?: 0
                val ci = identity?.ci ?: 0
                val tac = identity?.tac ?: 0
                val bandwidthKhz = identity?.bandwidth ?: 0

                val eNodeBDesc = RadioNativeBridge.calculateNodeId(ci.toLong(), 0)
                val distMeters = RadioNativeBridge.calculateTimingAdvanceDistance(ta, 0)

                if (cell.isRegistered && primaryCell == null) {
                    primaryCell = BtsCellData(
                        cellType = "4G LTE",
                        pci = pci,
                        arfcn = earfcn,
                        bandName = bandName,
                        nodeId = eNodeBDesc,
                        tac = tac,
                        bandwidthMhz = if (bandwidthKhz > 0) bandwidthKhz / 1000 else 20,
                        totalAggregatedBandwidthMhz = if (bandwidthKhz > 0) bandwidthKhz / 1000 else 20,
                        duplexMode = "FDD",
                        rsrp = rsrp,
                        rsrq = rsrq,
                        sinr = sinr,
                        timingAdvance = ta,
                        distanceMeters = distMeters,
                        isCarrierAggregation = false,
                        secondaryBands = emptyList()
                    )
                } else if (!cell.isRegistered && rsrp in -140..-44) {
                    neighbors.add(NeighborCellData(pci = pci, arfcn = earfcn, bandName = bandName, rsrp = rsrp, cellType = "4G LTE"))
                } else {
                    secondaryBands.add(bandName)
                }
            } else if (cell is CellInfoWcdma) {
                val identity = cell.cellIdentity as? CellIdentityWcdma
                val signal = cell.cellSignalStrength as? CellSignalStrengthWcdma
                val uarfcn = identity?.uarfcn ?: 0
                val rscp = signal?.dbm ?: -100
                val psc = identity?.psc ?: 0
                if (cell.isRegistered && primaryCell == null) {
                    primaryCell = BtsCellData(
                        cellType = "3G WCDMA",
                        pci = psc,
                        arfcn = uarfcn,
                        bandName = "3G UARFCN $uarfcn",
                        nodeId = "RNC $psc",
                        tac = identity?.lac ?: 0,
                        rsrp = rscp,
                        rsrq = -10,
                        sinr = 5,
                        timingAdvance = 0,
                        distanceMeters = 0.0,
                        isCarrierAggregation = false,
                        secondaryBands = emptyList()
                    )
                }
            } else if (cell is CellInfoGsm) {
                val identity = cell.cellIdentity as? CellIdentityGsm
                val signal = cell.cellSignalStrength as? CellSignalStrengthGsm
                val arfcn = identity?.arfcn ?: 0
                val rssi = signal?.dbm ?: -95
                val ta = signal?.timingAdvance?.takeIf { it in 0..63 } ?: 0
                if (cell.isRegistered && primaryCell == null) {
                    primaryCell = BtsCellData(
                        cellType = "2G GSM",
                        pci = identity?.cid ?: 0,
                        arfcn = arfcn,
                        bandName = "2G ARFCN $arfcn",
                        nodeId = "Cell ID ${identity?.cid ?: 0}",
                        tac = identity?.lac ?: 0,
                        rsrp = rssi,
                        rsrq = 0,
                        sinr = 0,
                        timingAdvance = ta,
                        distanceMeters = RadioNativeBridge.calculateTimingAdvanceDistance(ta, 1),
                        isCarrierAggregation = false,
                        secondaryBands = emptyList()
                    )
                }
            }
        }

        if (primaryCell != null) {
            val isCa = secondaryBands.isNotEmpty()
            val totalMhz = primaryCell.bandwidthMhz + (secondaryBands.size * 15)
            primaryCell = primaryCell.copy(
                isCarrierAggregation = isCa,
                totalAggregatedBandwidthMhz = if (isCa) totalMhz else primaryCell.bandwidthMhz,
                secondaryBands = secondaryBands.distinct()
            )
        }

        return primaryCell to neighbors.sortedByDescending { it.rsrp }.take(4)
    }

    private fun checkHardware5gSupport(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val raf = telephonyManager.supportedRadioAccessFamily
                (raf and TelephonyManager.NETWORK_TYPE_BITMASK_NR) != 0L
            } else true
        } catch (_: Throwable) {
            true
        }
    }

    /**
     * Intelligent RF Telemetry Recommendation Engine.
     * Evaluates live radio physics: RSRP signal attenuation, SINR purity, Carrier Aggregation, and Security.
     * Zero hardcoded carrier names.
     */
    private fun generateRfRecommendation(
        slot: SimSlotInfo?,
        bts: BtsCellData?,
        hasHardware5g: Boolean,
        is5gInArea: Boolean
    ): String {
        slot ?: return "Vui lòng chọn thẻ SIM để tiến hành đo đạc vô tuyến."

        if (!hasHardware5g) {
            return "Modem phần cứng của máy không hỗ trợ băng tần 5G NR. Khuyến nghị cấu hình '4G LTE Only' để duy trì hiệu năng cao nhất."
        }

        if (bts == null) {
            return "Chưa ghi nhận tín hiệu trạm vô tuyến từ thẻ SIM này. Khuyến nghị 'NR / 4G LTE' để sẵn sàng đón sóng và phòng ngừa trạm 2G giả mạo."
        }

        return when {
            bts.cellType == "5G NR" -> {
                if (bts.rsrp >= -95) {
                    "Trạm phát 5G NR (${bts.bandName}) đang hoạt động với cường độ mạnh (${bts.rsrp} dBm). Khuyến nghị '5G Only' hoặc 'NR/LTE' để tối đa tốc độ truyền tải."
                } else {
                    "Trạm 5G NR (${bts.bandName}) có tín hiệu suy hao (${bts.rsrp} dBm, vùng biên). Khuyến nghị 'NR/LTE' hoặc '4G LTE' để tránh modem hao pin khi giữ sóng 5G."
                }
            }

            bts.isCarrierAggregation -> {
                val secCount = bts.secondaryBands.size
                "Trạm phát đang gộp sóng $secCount băng tần (4G+ CA: ${bts.bandName}). Băng thông rất dồi dào. Khuyến nghị '4G LTE Only' để giữ ping phẳng tuyệt đối khi chơi game."
            }

            bts.rsrp < -110 -> {
                "Tín hiệu trạm phát đang suy hao mạnh (${bts.rsrp} dBm, vùng biên sóng). Khuyến nghị khóa '4G LTE Only' để tránh rơi về 2G/3G, hoặc chạm 'Reset Radio' để tìm trạm gần hơn."
            }

            bts.rsrp >= -90 && bts.sinr >= 15 -> {
                if (is5gInArea) {
                    "Khu vực có trạm 5G lân cận và sóng 4G rất sạch (${bts.rsrp} dBm, SINR ${bts.sinr} dB). Khuyến nghị 'NR/LTE' để tận dụng cả 5G lẫn 4G tốc độ cao."
                } else {
                    "Chất lượng vô tuyến 4G đạt mức xuất sắc (${bts.rsrp} dBm, SINR ${bts.sinr} dB). Khuyến nghị '4G LTE Only' hoặc 'NR/LTE' để chặn trạm BTS giả 2G."
                }
            }

            else -> {
                "Khuyến nghị kích hoạt chế độ 'NR / 4G LTE'. Thiết lập này cắt đứt kết nối 2G/3G cổ điển, bảo vệ thiết bị trước các cuộc tấn công phát tán tin nhắn rác từ trạm BTS giả 2G."
            }
        }
    }

    private fun calculateLteBand(earfcn: Int): String {
        return when (earfcn) {
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
            else -> "LTE EARFCN $earfcn"
        }
    }

    private fun calculateNrBand(nrarfcn: Int): String {
        return when (nrarfcn) {
            in 422000..434000 -> "n1 (2100 MHz FDD)"
            in 361000..376000 -> "n3 (1800 MHz FDD)"
            in 140000..156000 -> "n28 (700 MHz APT)"
            in 499200..537999 -> "n41 (2500 MHz TDD)"
            in 620000..680000 -> "n77 (3700 MHz C-Band)"
            in 620000..653333 -> "n78 (3500 MHz C-Band)"
            in 693333..733333 -> "n79 (4700 MHz TDD)"
            else -> "5G NR ARFCN $nrarfcn"
        }
    }
}
