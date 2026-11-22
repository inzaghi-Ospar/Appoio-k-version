import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  PackageCheck,
  User,
  CheckCircle2,
  Camera,
  Plus,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [mostrarModalAdicionar, setMostrarModalAdicionar] = useState(false);
  const [nomeBusca, setNomeBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [nomesSelecionados, setNomesSelecionados] = useState<string[]>([]);

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

  const buscarNomesCadastro = async (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setNomeBusca(valor);

    if (!valor || valor.length < 2) {
      setResultadosBusca([]);
      return;
    }

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from("cadastros")
        .select("nome_completo")
        .ilike("nome_completo", `%${valor}%`)
        .limit(10);

      if (error) {
        setResultadosBusca([]);
        return;
      }

      setResultadosBusca(data || []);
    } catch {
      setResultadosBusca([]);
    } finally {
      setBuscando(false);
    }
  };

  const adicionarNomeLista = (nomeCompleto: string) => {
    if (!nomeCompleto.trim()) return;
    if (nomesSelecionados.includes(nomeCompleto.trim())) return;

    setNomesSelecionados([...nomesSelecionados, nomeCompleto.trim()]);
    setNomeBusca("");
    setResultadosBusca([]);
  };

  const removerNomeLista = (nomeRemover: string) => {
    setNomesSelecionados(nomesSelecionados.filter((n) => n !== nomeRemover));
  };

  const confirmarAdicao = async () => {
      if (nomesSelecionados.length === 0) {
        alert("Adicione pelo menos um nome antes de confirmar.");
        return;
      }
  
      try {
              for (const nomeDestinatario of nomesSelecionados) {
                const { error } = await supabase.from("encomendas").insert({
                  codigo: `ENV-${Date.now()}`,
                  nome_destinatario: nomeDestinatario,
                  nome_entregador: nome,
                  status: "pronta",
                });
  
          if (error) {
            console.error("Erro detalhado:", error);
            alert(`Erro ao adicionar encomenda para ${nomeDestinatario}: ${error.message || "Erro desconhecido"}`);
            return;
          }
        }
  
        setMostrarModalAdicionar(false);
        setNomesSelecionados([]);
        setNomeBusca("");
        setResultadosBusca([]);
        carregarDados();
      } catch (err: any) {
        console.error("Erro catch:", err);
        alert(`Erro de conexão: ${err?.message || "Verifique sua internet e tente novamente."}`);
      }
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
                  onClick={() => setMostrarModalAdicionar(true)}
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

      {mostrarModalAdicionar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setMostrarModalAdicionar(false);
            setNomeBusca("");
            setResultadosBusca([]);
            setNomesSelecionados([]);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Adicionar encomendas
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalAdicionar(false);
                  setNomeBusca("");
                  setResultadosBusca([]);
                  setNomesSelecionados([]);
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Nome do destinatário
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Digite o nome..."
                    value={nomeBusca}
                    onChange={buscarNomesCadastro}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Busque no cadastro ou digite um nome novo.
                </p>
              </div>

              {buscando && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                </div>
              )}

              {!buscando && resultadosBusca.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {resultadosBusca.map((resultado, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => adicionarNomeLista(resultado.nome_completo)}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0"
                    >
                      {resultado.nome_completo}
                    </button>
                  ))}
                </div>
              )}

              {!buscando &&
                nomeBusca.trim().length >= 2 &&
                resultadosBusca.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-800">
                      Nenhum cadastro encontrado. Digite o nome e clique em
                      "Adicionar à lista" para incluir mesmo assim.
                    </p>
                  </div>
                )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!nomeBusca.trim()) return;
                    adicionarNomeLista(nomeBusca.trim());
                  }}
                  disabled={!nomeBusca.trim() || nomesSelecionados.includes(nomeBusca.trim())}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar à lista
                </button>
              </div>

              {nomesSelecionados.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">
                      Nomes para adicionar ({nomesSelecionados.length})
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {nomesSelecionados.map((nomeItem, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 last:border-b-0 bg-slate-50"
                      >
                        <span className="text-sm text-slate-700 truncate">
                          {nomeItem}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerNomeLista(nomeItem)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalAdicionar(false);
                    setNomeBusca("");
                    setResultadosBusca([]);
                    setNomesSelecionados([]);
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarAdicao}
                  disabled={nomesSelecionados.length === 0}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar ({nomesSelecionados.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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