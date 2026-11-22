import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Package, PackageCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [usuarioNome, setUsuarioNome] = useState("");
  const [encomendas, setEncomendas] = useState<any[]>([]);
    const [confirmadas, setConfirmadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarConfirmacaoLogout, setMostrarConfirmacaoLogout] = useState(false);

  useEffect(() => {
      const nomeSalvo = localStorage.getItem("usuario_nome");
      if (nomeSalvo) {
        setUsuarioNome(nomeSalvo);
      } else {
        // Para desenvolvimento: permite acesso direto a /tela-inicial com usuário de teste
        // Em produção, remova este bloco e descomente o redirect para /login
        setUsuarioNome("Usuário Teste");
        localStorage.setItem("usuario_nome", "Usuário Teste");
        
        // navigate("/login");
      }
    }, [navigate]);

  useEffect(() => {
    const carregarEncomendas = async () => {
      setCarregando(true);
      setErro("");

      try {
        const { data, error } = await supabase
          .from("encomendas")
          .select("*")
          .eq("status", "pronta")
          .order("created_at", { ascending: false });

        if (error) {
                  setErro("Erro ao carregar encomendas. Tente novamente.");
                  return;
                }
        
                if (data) {
                  setEncomendas(data);
                }
      } catch {
        setErro("Erro ao carregar encomendas. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };

    carregarEncomendas();

    const intervalo = setInterval(carregarEncomendas, 10 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC] pb-16">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6 p-4">
          <button
            type="button"
            onClick={() => setMostrarConfirmacaoLogout(true)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="px-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-500 mb-1">Usuário</h2>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {usuarioNome || "Visitante"}
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Encomendas pendentes de retirada
                      </h2>

            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : erro ? (
              <p className="text-sm text-destructive text-center py-8">{erro}</p>
            ) : encomendas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <PackageCheck className="w-7 h-7" />
                </div>
                <p className="text-sm text-slate-500">
                  Nenhuma encomenda disponível no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {encomendas.map((encomenda) => {
                                  const jaConfirmada = confirmadas.has(encomenda.id);
                
                                  return (
                                    <div
                                      key={encomenda.id}
                                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600">
                                          <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900">
                                            {encomenda.nome_entregador}
                                          </p>
                                          <p className="text-sm text-slate-500">
                                            {encomenda.nome_destinatario}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-slate-400">Chegou em</p>
                                        <p className="text-sm font-medium text-slate-700">
                                          {formatarData(encomenda.created_at)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-sm mx-auto flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 p-2 text-indigo-600">
            <Home className="w-6 h-6" />
            <span className="text-xs">Início</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-slate-400">
            <Package className="w-6 h-6" />
            <span className="text-xs">Encomendas</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-slate-400">
            <User className="w-6 h-6" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>

      {mostrarConfirmacaoLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setMostrarConfirmacaoLogout(false)}>
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sair da conta?</h3>
            <p className="text-sm text-slate-500 mb-6">Tem certeza que deseja sair da sua conta?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMostrarConfirmacaoLogout(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("usuario_nome");
                  setMostrarConfirmacaoLogout(false);
                  navigate("/login");
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
