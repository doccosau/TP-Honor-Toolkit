package vn.tp.radiointelligence.core.cellular

import android.content.Context
import android.os.Build
import android.telephony.CellIdentityGsm
import android.telephony.CellIdentityLte
import android.telephony.CellIdentityNr
import android.telephony.CellIdentityWcdma
import android.telephony.CellInfo
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellInfoWcdma
import android.telephony.CellSignalStrengthGsm
import android.telephony.CellSignalStrengthLte
import android.telephony.CellSignalStrengthNr
import android.telephony.CellSignalStrengthWcdma
import android.telephony.SignalStrength
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import vn.tp.radiointelligence.core.shizuku.ShizukuBridge
import vn.tp.radiointelligence.domain.model.BtsCellData
import vn.tp.radiointelligence.domain.model.CellularState
import vn.tp.radiointelligence.domain.model.NetworkModeLock
import vn.tp.radiointelligence.domain.model.SimSlotInfo

class TelephonyController(
    private val context: Context,
    private val shizukuBridge: ShizukuBridge
) {
    private val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    private val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager

    private val _cellularState = MutableStateFlow(CellularState())
    val cellularState: StateFlow<CellularState> = _cellularState.asStateFlow()

    companion object {
        const val BITMASK_LTE = 4096L
        const val BITMASK_LTE_CA = 262144L
        const val BITMASK_NR = 524288L
        const val BITMASK_4G_ONLY = BITMASK_LTE or BITMASK_LTE_CA
        const val BITMASK_5G_ONLY = BITMASK_NR
        const val BITMASK_NR_LTE = BITMASK_NR or BITMASK_4G_ONLY
        const val BITMASK_ALL_AUTO = -1L
    }

    suspend fun refreshAll() = withContext(Dispatchers.IO) {
        val slots = querySimSlots()
        val currentSlotIdx = _cellularState.value.selectedSlotIndex.coerceIn(0, (slots.size - 1).coerceAtLeast(0))
        val currentSlot = slots.getOrNull(currentSlotIdx)
        val currentSubId = currentSlot?.subId ?: SubscriptionManager.getDefaultSubscriptionId()

        val preferredMode = queryPreferredNetworkMode(currentSubId)
        val currentNetworkType = queryActiveNetworkTypeName(currentSubId)
        val smsc = querySmscAddress(currentSubId, currentSlot?.recommendedSmsc ?: "")
        val btsData = queryBtsCellData(currentSubId)
        val hasHardware5g = checkHardware5gSupport()
        val recommendation = generateSmartRecommendation(currentSlot, btsData)

        _cellularState.value = CellularState(
            slots = slots,
            selectedSlotIndex = currentSlotIdx,
            currentNetworkType = currentNetworkType,
            currentPreferredMode = preferredMode,
            smscNumber = smsc,
            btsInfo = btsData,
            hardware5gSupported = hasHardware5g,
            smartRecommendationReason = recommendation
        )
    }

    fun selectSlot(slotIndex: Int) {
        val slots = _cellularState.value.slots
        if (slotIndex in slots.indices) {
            _cellularState.value = _cellularState.value.copy(selectedSlotIndex = slotIndex)
        }
    }

    private fun querySimSlots(): List<SimSlotInfo> {
        val list = mutableListOf<SimSlotInfo>()
        try {
            val subList: List<SubscriptionInfo>? = subscriptionManager?.activeSubscriptionInfoList
            if (!subList.isNullOrEmpty()) {
                for (sub in subList) {
                    val rawCarrierName = sub.carrierName?.toString()?.takeIf { it.isNotBlank() } ?: "SIM ${sub.simSlotIndex + 1}"
                    val mcc = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) sub.mccString ?: "" else ""
                    val mnc = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) sub.mncString ?: "" else ""
                    val mccMnc = if (mcc.isNotBlank() && mnc.isNotBlank()) "$mcc$mnc" else ""

                    // Dynamic Carrier Intelligence Resolution
                    val carrierDetails = CarrierResolver.resolveCarrier(mccMnc, rawCarrierName)

                    // Signal level & dBm measurement
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

                    list.add(
                        SimSlotInfo(
                            slotIndex = sub.simSlotIndex,
                            subId = sub.subscriptionId,
                            carrierName = carrierDetails.operatorName,
                            displayName = sub.displayName?.toString()?.takeIf { it.isNotBlank() } ?: carrierDetails.operatorName,
                            isDataActive = (sub.subscriptionId == SubscriptionManager.getDefaultDataSubscriptionId()),
                            mccMnc = mccMnc,
                            signalLevel = signalLevel,
                            signalDbm = signalDbm,
                            recommendedSmsc = carrierDetails.recommendedSmsc,
                            carrierDetails = carrierDetails
                        )
                    )
                }
            }
        } catch (_: SecurityException) {
        } catch (_: Throwable) {
        }

        return list.sortedBy { it.slotIndex }
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

        _cellularState.value = _cellularState.value.copy(currentPreferredMode = mode)
        true
    }

    suspend fun restartRadioModem(subId: Int): Boolean = withContext(Dispatchers.IO) {
        val cmd = "cmd phone set-radio-power $subId false && sleep 1 && cmd phone set-radio-power $subId true"
        shizukuBridge.executeShellCommand(cmd)
        refreshAll()
        true
    }

    suspend fun launchNativeRadioInfo(): Boolean = withContext(Dispatchers.IO) {
        val cmd = "am start -n com.android.settings/.RadioInfo || am start -n com.android.phone/.settings.RadioInfo"
        val res = shizukuBridge.executeShellCommand(cmd)
        !res.contains("Error", ignoreCase = true)
    }

    private suspend fun querySmscAddress(subId: Int, dynamicFallback: String): String {
        try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            val getSmscMethod = specificTm.javaClass.getMethod("getSmscAddress")
            val result = getSmscMethod.invoke(specificTm) as? String
            if (!result.isNullOrBlank()) {
                return result.replace("\"", "").trim()
            }
        } catch (_: Throwable) {
        }

        val out = shizukuBridge.executeShellCommand("cmd phone get-smsc-address $subId")
        if (out.isNotBlank() && !out.contains("Error", ignoreCase = true) && !out.contains("Exception", ignoreCase = true)) {
            val cleaned = out.replace("\"", "").trim()
            if (cleaned.startsWith("+") || cleaned.matches(Regex("^[0-9]+$"))) {
                return cleaned
            }
        }

        return dynamicFallback
    }

    suspend fun updateSmscAddress(subId: Int, smscNumber: String): Boolean = withContext(Dispatchers.IO) {
        val sanitized = smscNumber.trim().replace("\"", "")
        if (sanitized.isBlank()) return@withContext false

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

        val cmd = "cmd phone set-smsc-address $subId \"$sanitized\""
        shizukuBridge.executeShellCommand(cmd)
        _cellularState.value = _cellularState.value.copy(smscNumber = sanitized)
        true
    }

    private fun queryActiveNetworkTypeName(subId: Int): String {
        return try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            when (specificTm.dataNetworkType) {
                TelephonyManager.NETWORK_TYPE_NR -> "5G NR Standalone (SA)"
                TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE Advanced"
                TelephonyManager.NETWORK_TYPE_HSPAP, TelephonyManager.NETWORK_TYPE_HSPA -> "3G HSPA+"
                TelephonyManager.NETWORK_TYPE_EDGE, TelephonyManager.NETWORK_TYPE_GPRS -> "2G GSM"
                else -> "Không có sóng Data"
            }
        } catch (_: Throwable) {
            "Chưa xác định"
        }
    }

    private fun queryBtsCellData(subId: Int): BtsCellData? {
        try {
            val specificTm = telephonyManager.createForSubscriptionId(subId)
            val cellInfoList: List<CellInfo>? = specificTm.allCellInfo
            if (!cellInfoList.isNullOrEmpty()) {
                var primaryCell: BtsCellData? = null
                val secondaryBands = mutableListOf<String>()

                for (cell in cellInfoList) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && cell is CellInfoNr) {
                        val identity = cell.cellIdentity as? CellIdentityNr
                        val signal = cell.cellSignalStrength as? CellSignalStrengthNr
                        val nrarfcn = identity?.nrarfcn ?: 0
                        val bandName = calculateNrBand(nrarfcn)
                        val rsrp = signal?.ssRsrp?.takeIf { it in -140..-44 } ?: signal?.csiRsrp?.takeIf { it in -140..-44 } ?: -100
                        val rsrq = signal?.ssRsrq?.takeIf { it in -20..-3 } ?: signal?.csiRsrq?.takeIf { it in -20..-3 } ?: -10
                        val sinr = signal?.ssSinr?.takeIf { it in -23..40 } ?: signal?.csiSinr?.takeIf { it in -23..40 } ?: 10
                        val pci = identity?.pci ?: 0

                        if (cell.isRegistered && primaryCell == null) {
                            primaryCell = BtsCellData(
                                cellType = "5G NR",
                                pci = pci,
                                arfcn = nrarfcn,
                                bandName = bandName,
                                rsrp = rsrp,
                                rsrq = rsrq,
                                sinr = sinr,
                                timingAdvance = 3,
                                distanceMeters = 3 * 78.12,
                                isCarrierAggregation = false,
                                secondaryBands = emptyList()
                            )
                        } else {
                            secondaryBands.add(bandName)
                        }
                    } else if (cell is CellInfoLte) {
                        val identity = cell.cellIdentity as? CellIdentityLte
                        val signal = cell.cellSignalStrength as? CellSignalStrengthLte
                        val earfcn = identity?.earfcn ?: 0
                        val bandName = calculateLteBand(earfcn)
                        val rsrp = signal?.rsrp?.takeIf { it in -140..-44 } ?: -105
                        val rsrq = signal?.rsrq?.takeIf { it in -20..-3 } ?: -12
                        val sinr = signal?.rssnr?.takeIf { it in -23..40 } ?: 10
                        val ta = signal?.timingAdvance?.takeIf { it in 0..1282 } ?: 0
                        val pci = identity?.pci ?: 0

                        if (cell.isRegistered && primaryCell == null) {
                            primaryCell = BtsCellData(
                                cellType = "4G LTE",
                                pci = pci,
                                arfcn = earfcn,
                                bandName = bandName,
                                rsrp = rsrp,
                                rsrq = rsrq,
                                sinr = sinr,
                                timingAdvance = ta,
                                distanceMeters = ta * 78.12,
                                isCarrierAggregation = false,
                                secondaryBands = emptyList()
                            )
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
                                rsrp = rssi,
                                rsrq = 0,
                                sinr = 0,
                                timingAdvance = ta,
                                distanceMeters = ta * 550.0,
                                isCarrierAggregation = false,
                                secondaryBands = emptyList()
                            )
                        }
                    }
                }

                if (primaryCell != null) {
                    val isCa = secondaryBands.isNotEmpty()
                    return primaryCell.copy(
                        isCarrierAggregation = isCa,
                        secondaryBands = secondaryBands.distinct()
                    )
                }
            }
        } catch (_: SecurityException) {
        } catch (_: Throwable) {
        }

        return null
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

    private fun generateSmartRecommendation(slot: SimSlotInfo?, bts: BtsCellData?): String {
        slot ?: return "Vui lòng chọn SIM để nhận diện năng lực mạng."
        val carrier = slot.carrierDetails

        return when {
            !carrier.is5gCapable -> {
                "Nhà mạng ${carrier.operatorName} chưa hỗ trợ 5G. Khuyến nghị chọn '4G LTE Only' để sóng phẳng, loại bỏ rớt 2G/3G."
            }
            bts?.cellType?.contains("5G", ignoreCase = true) == true -> {
                "Trạm phát hiện tại đang phát 5G (${bts.bandName}). Khuyến nghị '5G Only' hoặc 'NR/LTE' để tận dụng băng thông cực đại."
            }
            bts?.isCarrierAggregation == true -> {
                "Trạm đang gộp sóng 4G+ CA (${bts.bandName}). Khuyến nghị '4G LTE Only' để ping ổn định nhất khi chơi game và streaming."
            }
            else -> {
                "Khuyến nghị 'NR / 4G LTE' để bỏ hoàn toàn 2G/3G, vừa đảm bảo tốc độ vừa chặn nguy cơ trạm BTS giả mạo."
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
