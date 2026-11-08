package vn.tp.radiointelligence.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

data class MagicColors(
    val bg: Color,
    val card: Color,
    val cardBorder: Color,
    val cardSubtle: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val isDark: Boolean
)

val LocalMagicColors = staticCompositionLocalOf {
    MagicColors(
        bg = MagicLightBg,
        card = MagicLightCard,
        cardBorder = MagicLightCardBorder,
        cardSubtle = MagicLightCardSubtle,
        textPrimary = MagicLightTextPrimary,
        textSecondary = MagicLightTextSecondary,
        textTertiary = MagicLightTextTertiary,
        isDark = false
    )
}

private val LightColorScheme = lightColorScheme(
    primary = HonorBlue,
    onPrimary = Color.White,
    secondary = MagicEmerald,
    onSecondary = Color.White,
    background = MagicLightBg,
    surface = MagicLightCard,
    onBackground = MagicLightTextPrimary,
    onSurface = MagicLightTextPrimary
)

private val DarkColorScheme = darkColorScheme(
    primary = HonorBlue,
    onPrimary = Color.White,
    secondary = MagicEmerald,
    onSecondary = Color.White,
    background = MagicDarkBg,
    surface = MagicDarkCard,
    onBackground = MagicDarkTextPrimary,
    onSurface = MagicDarkTextPrimary
)

@Composable
fun TPRadioIntelligenceTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val magicColors = if (darkTheme) {
        MagicColors(
            bg = MagicDarkBg,
            card = MagicDarkCard,
            cardBorder = MagicDarkCardBorder,
            cardSubtle = MagicDarkCardSubtle,
            textPrimary = MagicDarkTextPrimary,
            textSecondary = MagicDarkTextSecondary,
            textTertiary = MagicDarkTextTertiary,
            isDark = true
        )
    } else {
        MagicColors(
            bg = MagicLightBg,
            card = MagicLightCard,
            cardBorder = MagicLightCardBorder,
            cardSubtle = MagicLightCardSubtle,
            textPrimary = MagicLightTextPrimary,
            textSecondary = MagicLightTextSecondary,
            textTertiary = MagicLightTextTertiary,
            isDark = false
        )
    }

    CompositionLocalProvider(LocalMagicColors provides magicColors) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
            typography = Typography,
            content = content
        )
    }
}
