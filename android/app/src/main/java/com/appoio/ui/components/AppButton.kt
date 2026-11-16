package com.appoio.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.appoio.ui.theme.AppoioOnPrimary
import com.appoio.ui.theme.AppoioPrimary

@Composable
fun AppButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    variant: ButtonVariant = ButtonVariant.Primary
) {
    when (variant) {
        ButtonVariant.Primary -> {
            Button(
                onClick = onClick,
                enabled = enabled,
                modifier = modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (enabled) AppoioPrimary else Color(0xFFCBD5E1),
                    contentColor = AppoioOnPrimary
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    text = text,
                    fontSize = 16.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                )
            }
        }
        ButtonVariant.Ghost -> {
            Button(
                onClick = onClick,
                enabled = enabled,
                modifier = modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    contentColor = AppoioPrimary
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    text = text,
                    fontSize = 16.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                )
            }
        }
    }
}

enum class ButtonVariant {
    Primary, Ghost
}