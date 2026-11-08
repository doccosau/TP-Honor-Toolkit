package vn.tp.radiointelligence.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val MagicOsColorScheme = darkColorScheme(
    primary = MagicCyan,
    onPrimary = MagicOsBgDark,
    secondary = MagicEmerald,
    onSecondary = MagicOsBgDark,
    background = MagicOsBgDark,
    surface = MagicCardBg,
    onBackground = MagicTextPrimary,
    onSurface = MagicTextPrimary
)

@Composable
fun TPRadioIntelligenceTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = MagicOsColorScheme,
        typography = Typography,
        content = content
    )
}
