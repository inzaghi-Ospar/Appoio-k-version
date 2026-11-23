import { useState, useEffect } from "react";
import { Download, CheckCircle2, X, AlertTriangle, Loader2 } from "lucide-react";
import { baixarAtualizacao, instalarAtualizacao, formatarBytes } from "@/services/update-service";

interface DownloadProgressoProps {
  url: string;
  onFechar: () => void;
  onInstalado: () => void;
}

type Estado = "aguardando" | "baixando" | "pronto" | "erro";

export const DownloadProgresso = ({ url, onFechar, onInstalado }: DownloadProgressoProps) => {
  const [estado, setEstado] = useState<Estado>("aguardando");
  const [progresso, setProgresso] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [caminhoArquivo, setCaminhoArquivo] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    let ativo = true;

    const iniciarDownload = async () => {
      setEstado("baixando");
      setErro(null);
      setProgresso(0);

      try {
        const resultado = await baixarAtualizacao(url, (p) => {
          if (!ativo) return;
          setProgresso(p.progress);
          setBytes(p.bytes);
          setTotal(p.total);
          if (p.status === "done") {
            setEstado("pronto");
            setCaminhoArquivo(resultado.path);
          }
        });
      } catch (err: any) {
        if (!ativo) return;
        setEstado("erro");
        setErro(err?.message || "Erro ao baixar a atualização.");
      }
    };

    iniciarDownload();

    return () => {
      ativo = false;
    };
  }, [url]);

  const handleInstalar = async () => {
    if (!caminhoArquivo) return;
    try {
      await instalarAtualizacao(caminhoArquivo);
      onInstalado();
    } catch (err) {
      setErro("Não foi possível iniciar a instalação.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                estado === "erro"
                  ? "bg-red-100 text-red-600"
                  : estado === "pronto"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              {estado === "erro" ? (
                <AlertTriangle className="w-5 h-5" />
              ) : estado === "pronto" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {estado === "erro"
                ? "Erro no download"
                : estado === "pronto"
                ? "Download concluído"
                : "Baixando atualização"}
            </h3>
          </div>
          {estado !== "baixando" && (
            <button
              type="button"
              onClick={onFechar}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {estado === "baixando" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Baixando...</span>
                  <span className="font-medium text-slate-900">{progresso}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-200"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatarBytes(bytes)}</span>
                  <span>{total ? formatarBytes(total) : "Calculando..."}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Não feche o app. A instalação começa automaticamente.
              </p>
            </>
          )}

          {estado === "pronto" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                A atualização foi baixada com sucesso. Toque em &ldquo;Instalar&rdquo; para instalar o APK.
              </p>
              <button
                type="button"
                onClick={handleInstalar}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2 font-medium"
              >
                <Download className="w-4 h-4" />
                Instalar APK
              </button>
            </div>
          )}

          {estado === "erro" && (
            <div className="space-y-4">
              <p className="text-sm text-red-600 text-center">
                {erro || "Não foi possível baixar a atualização."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEstado("baixando");
                  setErro(null);
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2 font-medium"
              >
                <Loader2 className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadProgresso;