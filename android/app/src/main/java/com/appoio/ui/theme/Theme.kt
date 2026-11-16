package com.appoio.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = AppoioPrimary,
    primaryContainer = Color(0xFFE0E7FF),
    secondary = Color(0xFF6B7280),
    background = AppoioBackground,
    surface = AppoioSurface,
    error = AppoioError,
    onPrimary = AppoioOnPrimary,
    onSecondary = Color.White,
    onBackground = AppoioTextPrimary,
    onSurface = AppoioTextPrimary,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = AppoioPrimary,
    primaryContainer = Color(0xFF4F46E5),
    secondary = Color(0xFF9CA3AF),
    background = Color(0xFF111827),
    surface = Color(0xFF1F2937),
    error = AppoioError,
    onPrimary = AppoioOnPrimary,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    onError = Color.White
)

@Composable
fun AppoioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = MaterialTheme.typography,
        content = content
    )
}