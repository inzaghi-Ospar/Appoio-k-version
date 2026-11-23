import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export interface DownloadProgress {
  progress: number; // 0 a 100
  bytes: number;
  total: number;
  status: "idle" | "downloading" | "done" | "error";
  error?: string;
}

const isNative = Capacitor.isNativePlatform();

/**
 * Baixa o APK de atualização.
 * - Em Android/iOS (Capacitor): usa Filesystem.downloadFile com progresso real.
 * - No navegador: usa fetch com ReadableStream para medir o progresso.
 */
export async function baixarAtualizacao(
  url: string,
  onProgress: (p: DownloadProgress) => void
): Promise<{ path: string; isNative: boolean }> {
  if (isNative) {
    return baixarNativo(url, onProgress);
  }
  return baixarWeb(url, onProgress);
}

async function baixarNativo(
  url: string,
  onProgress: (p: DownloadProgress) => void
): Promise<{ path: string; isNative: boolean }> {
  const fileName = `appoio-${Date.now()}.apk`;

  onProgress({ progress: 0, bytes: 0, total: 0, status: "downloading" });

  const progressListener = await Filesystem.addListener("progress", (progress) => {
    const percent =
      progress.contentLength > 0
        ? Math.round((progress.bytes / progress.contentLength) * 100)
        : 0;
    onProgress({
      progress: percent,
      bytes: progress.bytes,
      total: progress.contentLength,
      status: "downloading",
    });
  });

  try {
    const result = await Filesystem.downloadFile({
      url,
      path: fileName,
      directory: Directory.Cache,
      progress: true,
    });

    onProgress({
      progress: 100,
      bytes: 0,
      total: 0,
      status: "done",
    });

    return { path: result.path || fileName, isNative: true };
  } catch (err: any) {
    onProgress({
      progress: 0,
      bytes: 0,
      total: 0,
      status: "error",
      error: err?.message || "Falha ao baixar a atualização.",
    });
    throw err;
  } finally {
    progressListener.remove();
  }
}

async function baixarWeb(
  url: string,
  onProgress: (p: DownloadProgress) => void
): Promise<{ path: string; isNative: boolean }> {
  onProgress({ progress: 0, bytes: 0, total: 0, status: "downloading" });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
      // Sem suporte a stream: baixa de uma vez
      const blob = await response.blob();
      onProgress({ progress: 100, bytes: blob.size, total: blob.size, status: "done" });
      dispararDownloadWeb(blob);
      return { path: "web-download", isNative: false };
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        const percent = total > 0 ? Math.round((received / total) * 100) : 0;
        onProgress({
          progress: percent,
          bytes: received,
          total,
          status: "downloading",
        });
      }
    }

    const blob = new Blob(chunks as BlobPart[], {
      type: "application/vnd.android.package-archive",
    });
    onProgress({ progress: 100, bytes: blob.size, total: blob.size, status: "done" });
    dispararDownloadWeb(blob);
    return { path: "web-download", isNative: false };
  } catch (err: any) {
    onProgress({
      progress: 0,
      bytes: 0,
      total: 0,
      status: "error",
      error: err?.message || "Falha ao baixar a atualização.",
    });
    throw err;
  }
}

function dispararDownloadWeb(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `appoio-${Date.now()}.apk`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Abre o instalador do APK baixado (somente Android nativo).
 * No navegador não é possível instalar automaticamente.
 */
export async function instalarAtualizacao(path: string): Promise<void> {
  if (!isNative) return;

  try {
    const fileUri = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });

    // Abre o arquivo com o handler do sistema (aciona o instalador do Android)
    window.open(fileUri.uri, "_system");
  } catch (err) {
    console.error("Erro ao abrir instalador:", err);
  }
}

export function formatarBytes(bytes: number): string {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}
