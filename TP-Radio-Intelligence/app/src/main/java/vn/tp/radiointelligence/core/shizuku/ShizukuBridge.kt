package vn.tp.radiointelligence.core.shizuku

import android.content.Context
import android.content.pm.PackageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader

data class ShizukuStatus(
    val isAvailable: Boolean = false,
    val hasPermission: Boolean = false,
    val uid: Int = -1,
    val version: Int = -1
)

class ShizukuBridge {

    companion object {
        const val SHIZUKU_PACKAGE = "moe.shizuku.privileged.api"

        private val newProcessMethod: java.lang.reflect.Method by lazy {
            Shizuku::class.java.getDeclaredMethod(
                "newProcess",
                Array<String>::class.java,
                Array<String>::class.java,
                String::class.java
            ).apply { isAccessible = true }
        }
    }

    private val _status = MutableStateFlow(ShizukuStatus(isAvailable = false, hasPermission = false))
    val status: StateFlow<ShizukuStatus> = _status.asStateFlow()

    private val binderReceivedListener = Shizuku.OnBinderReceivedListener {
        checkStatus()
    }

    private val binderDeadListener = Shizuku.OnBinderDeadListener {
        checkStatus()
    }

    private val requestPermissionResultListener = Shizuku.OnRequestPermissionResultListener { _, _ ->
        checkStatus()
    }

    init {
        try {
            Shizuku.addBinderReceivedListenerSticky(binderReceivedListener)
            Shizuku.addBinderDeadListener(binderDeadListener)
            Shizuku.addRequestPermissionResultListener(requestPermissionResultListener)
        } catch (_: Throwable) {
            // JVM unit test fallback
        }
        checkStatus()
    }

    fun checkStatus(): ShizukuStatus {
        val ping = try {
            Shizuku.pingBinder()
        } catch (_: Throwable) {
            false
        }

        if (!ping) {
            val status = ShizukuStatus(isAvailable = false, hasPermission = false)
            _status.value = status
            return status
        }

        val hasPermission = try {
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (_: Throwable) {
            false
        }

        val uid = try {
            Shizuku.getUid()
        } catch (_: Throwable) {
            -1
        }

        val version = try {
            Shizuku.getVersion()
        } catch (_: Throwable) {
            -1
        }

        val result = ShizukuStatus(
            isAvailable = true,
            hasPermission = hasPermission,
            uid = uid,
            version = version
        )
        _status.value = result
        return result
    }

    fun requestPermission(requestCode: Int = 1001, context: Context? = null) {
        try {
            checkStatus()
            if (Shizuku.pingBinder()) {
                if (Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                    Shizuku.requestPermission(requestCode)
                }
            } else if (context != null) {
                val intent = context.packageManager.getLaunchIntentForPackage(SHIZUKU_PACKAGE)
                if (intent != null) {
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                }
            }
        } catch (_: Throwable) {
        }
    }

    suspend fun executeShellCommand(command: String): String = withContext(Dispatchers.IO) {
        val currentStatus = checkStatus()
        if (!currentStatus.hasPermission) {
            return@withContext ""
        }

        try {
            val cmdArray = arrayOf("sh", "-c", command)
            val process = newProcessMethod.invoke(null, cmdArray, null, null) as Process
            val output = StringBuilder()
            BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.appendLine(line)
                }
            }
            process.waitFor()
            output.toString().trim()
        } catch (e: Throwable) {
            ""
        }
    }

    fun destroy() {
        try {
            Shizuku.removeBinderReceivedListener(binderReceivedListener)
            Shizuku.removeBinderDeadListener(binderDeadListener)
            Shizuku.removeRequestPermissionResultListener(requestPermissionResultListener)
        } catch (_: Throwable) {
        }
    }
}

