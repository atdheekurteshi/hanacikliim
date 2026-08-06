package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = CrimsonRose,
    onPrimary = Color.White,
    secondary = TwilightPurple,
    onSecondary = Color.Black,
    tertiary = BlossomGold,
    background = MidnightCanvas,
    onBackground = LightText,
    surface = CardTwilight,
    onSurface = LightText,
    outline = BorderColor,
    surfaceVariant = Color(0xFF261D3D),
    onSurfaceVariant = GentleGray
)

private val LightColorScheme = lightColorScheme(
    primary = CrimsonRose,
    onPrimary = Color.White,
    secondary = TwilightPurple,
    onSecondary = Color.Black,
    tertiary = BlossomGold,
    background = Color(0xFFF7F5FC),
    onBackground = DarkText,
    surface = Color.White,
    onSurface = DarkText,
    outline = BorderColorLight,
    surfaceVariant = Color(0xFFEFEAF5),
    onSurfaceVariant = Color(0xFF4A4458)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
