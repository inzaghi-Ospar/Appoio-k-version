package com.appoio.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import com.appoio.ui.theme.AppoioError
import com.appoio.ui.theme.AppoioPrimary
import com.appoio.ui.theme.AppoioTextPrimary
import com.appoio.ui.theme.AppoioTextSecondary
import com.appoio.ui.theme.AppoioH1
import com.appoio.ui.theme.AppoioBody

@Composable
fun CadastroScreen(
    onNavigateToWelcome: () -> Unit,
    onCadastro: (String, String, String, String) -> Unit
) {
    var nomeCompleto by remember { mutableStateOf("") }
    var telefone by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var confirmarSenha by remember { mutableStateOf("") }
    var senhaVisivel by remember { mutableStateOf(false) }
    var confirmarSenhaVisivel by remember { mutableStateOf(false) }

    var erroNome by remember { mutableStateOf(false) }
    var erroTelefone by remember { mutableStateOf(false) }
    var erroSenha by remember { mutableStateOf(false) }
    var erroConfirmarSenha by remember { mutableStateOf(false) }

    var mensagemNome by remember { mutableStateOf("") }
    var mensagemTelefone by remember { mutableStateOf("") }
    var mensagemSenha by remember { mutableStateOf("") }
    var mensagemConfirmarSenha by remember { mutableStateOf("") }

    // Máscara de telefone
    fun formatarTelefone(valor: String): String {
        val digitos = valor.filter { it.isDigit() }.take(11).joinToString("")
        return when (digitos.length) {
            0 -> ""
            1, 2 -> "(${digitos}"
            3, 4, 5, 6 -> "(${digitos.substring(0, 2)}) ${digitos.substring(2)}"
            7, 8, 9, 10 -> "(${digitos.substring(0, 2)}) ${digitos.substring(2, 6)}-${digitos.substring(6)}"
            else -> "(${digitos.substring(0, 2)}) ${digitos.substring(2, 7)}-${digitos.substring(7)}"
        }
    }

    fun validarCadastro(): Boolean {
        var valido = true

        // Nome
        val partesNome = nomeCompleto.trim().split(" ").filter { it.isNotEmpty() }
        if (partesNome.size < 2) {
            erroNome = true
            mensagemNome = "Digite seu nome completo (nome e sobrenome)."
            valido = false
        } else {
            erroNome = false
            mensagemNome = ""
        }

        // Telefone
        val digitosTel = telefone.filter { it.isDigit() }
        if (digitosTel.length < 10 || digitosTel.length > 11) {
            erroTelefone = true
            mensagemTelefone = "Telefone em formato inválido. Ex: (21) 91234-5678"
            valido = false
        } else {
            erroTelefone = false
            mensagemTelefone = ""
        }

        // Senha
        if (senha.length < 4) {
            erroSenha = true
            mensagemSenha = "A senha deve ter no mínimo 4 caracteres."
            valido = false
        } else {
            erroSenha = false
            mensagemSenha = ""
        }

        // Confirmar senha
        if (senha != confirmarSenha) {
            erroConfirmarSenha = true
            mensagemConfirmarSenha = "As senhas não coincidem. Digite a mesma senha nos dois campos."
            valido = false
        } else {
            erroConfirmarSenha = false
            mensagemConfirmarSenha = ""
        }

        return valido
    }

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
            text = "Criar conta",
            style = AppoioH1,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Subtítulo
        Text(
            text = "Preencha seus dados para começar",
            style = AppoioBody,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.TextAlign.Center
        )

        // Nome completo
        AppInput(
            value = nomeCompleto,
            onValueChange = { nomeCompleto = it; erroNome = false },
            label = "Nome completo",
            placeholder = "Digite seu nome completo",
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            isError = erroNome,
            errorText = mensagemNome
        )

        // Telefone com máscara
        AppInput(
            value = telefone,
            onValueChange = { telefone = formatarTelefone(it); erroTelefone = false },
            label = "Telefone (WhatsApp)",
            placeholder = "(00) 00000-0000",
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            isError = erroTelefone,
            errorText = mensagemTelefone
        )

        // Senha
        AppInput(
            value = senha,
            onValueChange = { senha = it; erroSenha = false },
            label = "Senha",
            placeholder = "Crie sua senha",
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Password,
            visualTransformation = if (senhaVisivel) null else androidx.compose.ui.text.input.VisualTransformation.Password,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            isError = erroSenha,
            errorText = mensagemSenha
        )

        // Confirmar senha
        AppInput(
            value = confirmarSenha,
            onValueChange = { confirmarSenha = it; erroConfirmarSenha = false },
            label = "Confirmar senha",
            placeholder = "Repita sua senha",
            keyboardType = androidx.compose.ui.text.input.KeyboardType.Password,
            visualTransformation = if (confirmarSenhaVisivel) null else androidx.compose.ui.text.input.VisualTransformation.Password,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            isError = erroConfirmarSenha,
            errorText = mensagemConfirmarSenha
        )

        // Botão cadastrar
        AppButton(
            text = "Confirmar cadastro",
            onClick = {
                if (validarCadastro()) {
                    onCadastro(nomeCompleto, telefone, senha, confirmarSenha)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 32.dp)
        )
    }
}