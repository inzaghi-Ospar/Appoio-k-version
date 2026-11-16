package com.appoio.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appoio.ui.components.AppButton
import com.appoio.ui.components.AppInput
import com.appoio.ui.theme.AppoioBackground
import com.appoio.ui.theme.AppoioTextPrimary
import com.appoio.ui.theme.AppoioTextSecondary
import com.appoio.ui.theme.AppoioH1
import com.appoio.ui.theme.AppoioBody

@Composable
fun LoginScreen(
    onNavigateToWelcome: () -> Unit,
    onNavigateToCadastro: () -> Unit,
    onLogin: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var senhaVisivel by remember { mutableStateOf(false) }
    var erroLogin by remember { mutableStateOf(false) }
    var mensagemErro by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Voltar
        TextButton(
            onClick = onNavigateToWelcome,
            modifier = Modifier.fillMaxWidth().align(Alignment.Start)
        ) {
            Text(
                text = "← Voltar",
                color = com.appoio.ui.theme.AppoioPrimary,
                fontSize = 14.sp
            )
        }

        // Título
        Text(
            text = "Entrar",
            style = AppoioH1,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Subtítulo
        Text(
            text = "Faça login para acessar sua conta",
            style = AppoioBody,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Email
        AppInput(
            value = email,
            onValueChange = { email = it },
            label = "E-mail",
            placeholder = "seu@email.com",
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Email,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp)
        )

        // Senha
        AppInput(
            value = senha,
            onValueChange = { senha = it },
            label = "Senha",
            placeholder = "••••••••",
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Password,
            visualTransformation = if (senhaVisivel) null else androidx.compose.ui.text.input.VisualTransformation.Password,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            singleLine = true
        )

        // Esqueceu a senha
        TextButton(
            onClick = {},
            modifier = Modifier.fillMaxWidth().align(Alignment.End).padding(horizontal = 32.dp)
        ) {
            Text(
                text = "Esqueceu a senha?",
                color = com.appoio.ui.theme.AppoioPrimary,
                fontSize = 14.sp
            )
        }

        // Botão entrar
        AppButton(
            text = "Entrar",
            onClick = {
                if (email.isNotEmpty() && senha.isNotEmpty()) {
                    onLogin(email, senha)
                } else {
                    erroLogin = true
                    mensagemErro = "Preencha todos os campos"
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 32.dp)
        )

        // Mensagem de erro
        if (erroLogin) {
            Text(
                text = mensagemErro,
                color = com.appoio.ui.theme.AppoioError,
                fontSize = 14.sp,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp, top = 8.dp)
            )
        }

        // Cadastro
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Text(
                text = "Não tem uma conta? ",
                color = AppoioTextSecondary,
                fontSize = 14.sp
            )
            TextButton(
                onClick = onNavigateToCadastro
            ) {
                Text(
                    text = "Criar conta",
                    color = com.appoio.ui.theme.AppoioPrimary,
                    fontSize = 14.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                )
            }
        }
    }
}