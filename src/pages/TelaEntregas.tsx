import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, User, LogOut, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TelaEntregas = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("entregador_nome");
    if (nomeSalvo) {
      setNome(nomeSalvo);
      buscarEncomendas(nomeSalvo);
    } else {
      navigate("/login-entregador");
    }
  }, [navigate]);

  const buscarEncomendas = async (entregadorNome: string) => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("*")
        .eq("entregador", entregadorNome)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar encomendas:", error);
        setEncomendas([]);
      } else {
        setEncomendas(data || []);
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
      setEncomendas([]);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarEntrega = async (id: string) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ status: "entregue", entregue_em: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        alert("Erro ao confirmar entrega. Tente novamente.");
        return;
      }

      setEncomendas(encomendas.filter((e) => e.id !== id));
    } catch {
      alert("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sair = () => {
    localStorage.removeItem("entregador_nome");
    navigate("/login-entregador");
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Área do Entregador</h1>
                  <p className="text-sm opacity-90">{nome}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={sair}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : encomendas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhuma encomenda pendente
                </h2>
                <p className="text-sm text-slate-500">
                  Todas as entregas foram confirmadas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-slate-600 mb-3">
                  Encomendas para confirmar ({encomendas.length})
                </h2>
                {encomendas.map((encomenda) => (
                  <div
                    key={encomenda.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-900 truncate">
                            {encomenda.nome_destinatario}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                            Pendente
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {encomenda.endereco}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatarData(encomenda.created_at)}
                        </p>
                      </div>
                      <Button
                        onClick={() => confirmarEntrega(encomenda.id)}
                        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Appoio - Sistema de recebimento de encomendas
        </p>
      </div>
    </div>
  );
};

export default TelaEntregas;