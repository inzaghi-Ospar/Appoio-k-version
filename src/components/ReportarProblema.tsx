import { useState } from "react";
import { AlertCircle, Lightbulb, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Tipo = "problema" | "sugestao";

interface ReportarProblemaProps {
  usuarioNome: string;
  usuarioTipo: "cliente" | "entregador";
}

const ReportarProblema = ({ usuarioNome, usuarioTipo }: ReportarProblemaProps) => {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("problema");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async () => {
    if (!mensagem.trim()) {
      setErro("Escreva sua mensagem antes de enviar.");
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      const { error } = await supabase.from("feedback").insert({
        tipo,
        mensagem: mensagem.trim(),
        usuario_nome: usuarioNome,
        usuario_tipo: usuarioTipo,
      });

      if (error) {
        setErro("Não foi possível enviar. Tente novamente.");
        return;
      }

      setEnviado(true);
      setMensagem("");
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const fechar = () => {
    setAberto(false);
    setEnviado(false);
    setErro("");
    setMensagem("");
    setTipo("problema");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
        onClick={() => setAberto(true)}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Reportar problema ou sugestão
      </Button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={fechar}
        >
          <div
            className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {enviado ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Enviado!
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Obrigado pelo seu feedback. Vamos analisar sua mensagem.
                </p>
                <Button
                  type="button"
                  className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={fechar}
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Reportar problema ou sugestão
                  </h3>
                  <button
                    type="button"
                    onClick={fechar}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipo("problema")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        tipo === "problema"
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Problema
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo("sugestao")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        tipo === "sugestao"
                          ? "border-amber-500 bg-amber-50 text-amber-600"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Lightbulb className="w-4 h-4" />
                      Sugestão
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Descreva sua mensagem
                    </label>
                    <textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder={
                        tipo === "problema"
                          ? "Descreva o problema que você encontrou..."
                          : "Descreva sua sugestão..."
                      }
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {erro && <p className="text-sm text-destructive">{erro}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={fechar}
                      className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={enviar}
                      disabled={enviando}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      {enviando ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportarProblema;
