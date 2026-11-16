package com.appoio.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class Usuario(
    val nomeCompleto: String,
    val telefone: String,
    val senha: String
)

class UserRepository {
    suspend fun cadastrar(usuario: Usuario): Boolean {
        return withContext(Dispatchers.IO) {
            // TODO: chamar sua API aqui
            true
        }
    }

    suspend fun login(email: String, senha: String): Boolean {
        return withContext(Dispatchers.IO) {
            // TODO: chamar sua API aqui
            true
        }
    }
}