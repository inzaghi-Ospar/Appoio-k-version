#!/bin/bash

echo "=========================================="
echo "  Instalando Capacitor..."
echo "=========================================="
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/filesystem @capacitor/device @capacitor/app

echo "=========================================="
echo "  Buildando o app web..."
echo "=========================================="
npm run build

echo "=========================================="
echo "  Inicializando Capacitor..."
echo "=========================================="
npx cap init Appoio com.appoio.app --web-dir dist

echo "=========================================="
echo "  Adicionando Android..."
echo "=========================================="
npx cap add android

echo "=========================================="
echo "  Sincronizando..."
echo "=========================================="
npx cap sync

echo "=========================================="
echo "  Abrindo Android..."
echo "=========================================="
npx cap open android

echo "=========================================="
echo "  FEITO!"
echo "=========================================="
echo "No Android Studio:"
echo "1. Build -> Generate Signed Bundle / APK"
echo "2. Escolha APK"
echo "3. Crie/Escolha uma keystore"
echo "4. Build"
echo "APK em: android/app/build/outputs/apk/debug/app-debug.apk"