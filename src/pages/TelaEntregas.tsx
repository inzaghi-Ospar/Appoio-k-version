import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  PackageCheck,
  User,
  CheckCircle2,
  Clock,
  Camera,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Aba = "pendentes" | "historico" | "perfil";

const TelaEntregas = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<Aba>("pendentes");
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarConfirmacaoLogout, setMostrarConfirmacaoLogout] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("entregador_nome");
    if (nomeSalvo) {
      setNome(nomeSalvo);
      carregarDados();
    } else {
      navigate("/login-entregador");
    }
  }, [navigate]);

  const carregarPendentes = async () => {
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

      setPendentes(data || []);
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  };

  const carregarHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("*")
        .eq("status", "retirada")
        .order("retirado_em", { ascending: false });

      if (error) return;
      if (data) setHistorico(data);
    } catch {
      // mantém o histórico vazio se falhar
    }
  };

  const carregarDados = async () => {
    setCarregando(true);
    setErro("");

    await carregarPendentes();
    await carregarHistorico();

    setCarregando(false);
  };

  const confirmarEntrega = async (id: string) => {
      try {
        const { error } = await supabase
          .from("encomendas")
          .update({ status: "retirada", retirado_em: new Date().toISOString() })
          .eq("id", id);
  
        if (error) {
          alert("Erro ao confirmar entrega. Tente novamente.");
          return;
        }
  
        setPendentes(pendentes.filter((e) => e.id !== id));
                if (nome) carregarDados();
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

  const handleFotoPerfil = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPerfil(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sair = () => {
    localStorage.removeItem("entregador_nome");
    navigate("/login-entregador");
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
          {abaAtiva === "pendentes" && (
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Encomendas pendentes
                </h2>
                <Button
                  onClick={() => {
                    // TODO: configurar fluxo de adicionar entrega
                    alert("Funcionalidade de adicionar entrega será configurada em breve.");
                  }}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {carregando ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : erro ? (
                <p className="text-sm text-destructive text-center py-8">{erro}</p>
              ) : pendentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                    <Package className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Nenhuma encomenda pendente no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendentes.map((encomenda) => (
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
                                              {encomenda.nome_destinatario}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                              Entregador: {encomenda.nome_entregador}
                                            </p>
                                          </div>
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
                                    ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "historico" && (
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Histórico de entregas
              </h2>

              {carregando ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : historico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Nenhuma entrega confirmada no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historico.map((item) => (
                                      <div
                                        key={item.id}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                                      >
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-slate-900">
                                              {item.nome_destinatario}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                              Entregador: {item.nome_entregador}
                                            </p>
                                          </div>
                                        </div>
                  
                                        <div className="space-y-1 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Retirada em</span>
                                            <span className="font-medium text-slate-700">
                                              {formatarData(item.retirado_em)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "perfil" && (
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Perfil</h2>
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {fotoPerfil ? (
                      <img
                        src={fotoPerfil}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-indigo-600" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="foto-perfil-entregador"
                    onChange={handleFotoPerfil}
                  />
                  <label
                    htmlFor="foto-perfil-entregador"
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  {nome || "Entregador"}
                </p>
                <p className="text-xs text-slate-400">
                  Entregador
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-sm mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => setAbaAtiva("pendentes")}
            className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === "pendentes" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs">Pendentes</span>
          </button>
          <button
            onClick={() => setAbaAtiva("historico")}
            className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === "historico" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <PackageCheck className="w-6 h-6" />
            <span className="text-xs">Histórico</span>
          </button>
          <button
            onClick={() => setAbaAtiva("perfil")}
            className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === "perfil" ? "text-indigo-600" : "text-slate-400"}`}
          >
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
                  localStorage.removeItem("entregador_nome");
                  setMostrarConfirmacaoLogout(false);
                  navigate("/login-entregador");
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

export default TelaEntregas;