package com.appoio.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appoio.ui.components.AppButton
import com.appoio.ui.theme.AppoioBackground
import com.appoio.ui.theme.AppoioPrimary
import com.appoio.ui.theme.AppoioTextPrimary
import com.appoio.ui.theme.AppoioTextSecondary
import com.appoio.ui.theme.AppoioH1
import com.appoio.ui.theme.AppoioBody

@Composable
fun WelcomeScreen(
    onCreateAccount: () -> Unit,
    onLogin: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Ícone
        Surface(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(20.dp)),
            color = AppoioPrimary.copy(alpha = 0.1f)
        ) {
            Icon(
                imageVector = androidx.compose.material3.Icons.Default.Package,
                contentDescription = "Appoio logo",
                modifier = Modifier
                    .size(32.dp)
                    .align(Alignment.Center),
                tint = AppoioPrimary
            )
        }

        // Título
        Text(
            text = "Bem-vindo ao Appoio",
            style = AppoioH1,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Subtítulo
        Text(
            text = "Gerencie seus pedidos, organize seu estoque e faça mais negócios de forma simples e rápida.",
            style = AppoioBody,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Espaço para empurrar botões para baixo
        Spacer(modifier = Modifier.weight(1f))

        // Botões
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AppButton(
                text = "Criar conta",
                onClick = onCreateAccount,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 32.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            AppButton(
                text = "Já tenho conta",
                onClick = onLogin,
                variant = ButtonVariant.Ghost,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 32.dp)
            )
        }
    }
}

private fun Spacer(modifier: Modifier) = androidx.compose.foundation.layout.Spacer(modifier = modifier)

private fun RoundedCornerShape(radius: Dp) = androidx.compose.foundation.shape.RoundedCornerShape(radius)