package com.appoio.ui.screens

import androidx.compose.animation.AnimatedContentScope
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.appoio.ui.theme.AppoioBackground

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "welcome",
        modifier = Modifier.fillMaxSize(),
        enterTransition = { slideInVertically { it } + fadeIn(animationSpec = tween(300)) },
        exitTransition = { slideOutVertically { it } + fadeOut(animationSpec = tween(300)) },
        popEnterTransition = { fadeIn(animationSpec = tween(300)) },
        popExitTransition = { fadeOut(animationSpec = tween(300)) }
    ) {
        composable("welcome") {
            WelcomeScreen(
                onCreateAccount = { navController.navigate("cadastro") },
                onLogin = { navController.navigate("login") }
            )
        }

        composable("login") {
            LoginScreen(
                onNavigateToWelcome = { navController.popBackStack() },
                onNavigateToCadastro = { navController.navigate("cadastro") },
                onLogin = { email, senha ->
                    // Aqui você chama sua API de login
                }
            )
        }

        composable("cadastro") {
            CadastroScreen(
                onNavigateToWelcome = { navController.popBackStack() },
                onCadastro = { nome, telefone, senha, confirmar ->
                    // Aqui você chama sua API de cadastro
                }
            )
        }
    }
}