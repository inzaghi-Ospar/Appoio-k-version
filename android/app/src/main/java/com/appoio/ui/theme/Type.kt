package com.appoio.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AppoioTypography = TextStyle(
    fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 16.sp
)

val AppoioH1 = TextStyle(
    fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
    fontWeight = FontWeight.Bold,
    fontSize = 32.sp,
    color = AppoioTextPrimary
)

val AppoioBody = TextStyle(
    fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 16.sp,
    color = AppoioTextSecondary
)