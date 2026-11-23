import { Download, X, AlertTriangle } from "lucide-react";

interface AtualizacaoDialogProps {
  aberto: boolean;
  versaoAtual: string;
  versaoRemota: string;
  mensagem: string;
  forcarAtualizacao: boolean;
  urlDownload: string;
  onFechar: () => void;
}

const AtualizacaoDialog = ({
  aberto,
  versaoAtual,
  versaoRemota,
  mensagem,
  forcarAtualizacao,
  urlDownload,
  onFechar,
}: AtualizacaoDialogProps) => {
  if (!aberto) return null;

  const baixarAtualizacao = () => {
    window.open(urlDownload, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Atualização disponível
            </h3>
          </div>
          {!forcarAtualizacao && (
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
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Versão atual</span>
              <span className="text-sm font-medium text-slate-700">{versaoAtual}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Nova versão</span>
              <span className="text-sm font-medium text-indigo-600">{versaoRemota}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 text-center">
            {mensagem}
          </p>

          <div className="flex gap-3 pt-1">
            {!forcarAtualizacao && (
              <button
                type="button"
                onClick={onFechar}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Agora não
              </button>
            )}
            <button
              type="button"
              onClick={baixarAtualizacao}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtualizacaoDialog;