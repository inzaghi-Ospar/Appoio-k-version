package com.appoio.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appoio.ui.theme.AppoioBorder
import com.appoio.ui.theme.AppoioError
import com.appoio.ui.theme.AppoioTextPrimary
import com.appoio.ui.theme.AppoioTextSecondary

@Composable
fun AppInput(
    value: String,
    onValueChange: (String) -> Unit,
    label: String = "",
    placeholder: String = "",
    isError: Boolean = false,
    errorText: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation? = null,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true
) {
    var error by remember { mutableStateOf(isError) }

    TextField(
        value = value,
        onValueChange = { onValueChange(it); error = false },
        label = { if (label.isNotEmpty()) Text(text = label) },
        placeholder = { if (placeholder.isNotEmpty()) Text(text = placeholder) },
        leadingIcon = null,
        trailingIcon = null,
        isError = error || isError,
        colors = TextFieldDefaults.textFieldColors(
            focusedContainerColor = if (error || isError) AppoioError else Color(0xFFE5E7EB),
            unfocusedContainerColor = if (error || isError) AppoioError else Color(0xFFF3F4F6),
            disabledContainerColor = Color(0xFFF9FAFB)
        ),
        textStyle = LocalTextStyle.current.copy(
            color = AppoioTextPrimary,
            fontSize = 16.sp
        ),
        labelStyle = androidx.compose.material3.TextDefaults.labelStyle(
            color = if (error || isError) AppoioError else AppoioTextSecondary
        ),
        placeholderStyle = androidx.compose.material3.TextDefaults.placeholderStyle(
            color = AppoioTextSecondary
        ),
        singleLine = singleLine,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = visualTransformation,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .border(
                width = 1.dp,
                color = if (error || isError) AppoioError else AppoioBorder,
                shape = RoundedCornerShape(12.dp)
            ),
        shape = RoundedCornerShape(12.dp)
    )

    errorText?.let {
        Text(
            text = it,
            color = AppoioError,
            fontSize = 12.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, top = 4.dp)
        )
    }
}