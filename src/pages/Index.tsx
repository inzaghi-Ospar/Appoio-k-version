import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Package,
  PackageCheck,
  User,
  CheckCircle2,
  Clock,
  Camera,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import ReportarProblema from "@/components/ReportarProblema";
import { formatarData } from "@/lib/format";

type Aba = "inicio" | "encomendas" | "perfil";

const LIMITE_LISTA = 20;

const Index = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<{ id: string; nome_completo: string; email: string; tipo_usuario: "cliente" | "entregador" } | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("inicio");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [encomendasPagina, setEncomendasPagina] = useState(LIMITE_LISTA);
  const [historico, setHistorico] = useState<any[]>([]);
  const [historicoPagina, setHistoricoPagina] = useState(LIMITE_LISTA);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarConfirmacaoLogout, setMostrarConfirmacaoLogout] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        setUsuario({
          id: user.id,
          nome_completo: user.user_metadata?.nome_completo || user.email || "Usuário",
          email: user.email || "",
          tipo_usuario: user.user_metadata?.tipo_usuario || "cliente",
        });
      } else {
        setUsuario(null);
        navigate("/login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (fotoUrl) {
        URL.revokeObjectURL(fotoUrl);
      }
    };
  }, [fotoUrl]);

  const carregarEncomendas = async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("*")
        .eq("status", "pronta")
        .eq("user_id", usuario.id)
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

  useEffect(() => {
    carregarEncomendas();

    let intervalo: ReturnType<typeof setInterval>;

    const iniciarIntervalo = () => {
      intervalo = setInterval(carregarEncomendas, 10 * 60 * 1000);
    };

    const pararIntervalo = () => {
      clearInterval(intervalo);
    };

    iniciarIntervalo();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pararIntervalo();
      } else {
        iniciarIntervalo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [usuario]);

  useEffect(() => {
    const carregarHistorico = async () => {
      if (!usuario) return;
      try {
        const { data, error } = await supabase
          .from("encomendas")
          .select("*")
          .eq("status", "retirada")
          .eq("user_id", usuario.id)
          .order("retirado_em", { ascending: false });

        if (error) return;
        if (data && data.length > 0) {
          setHistorico(data);
        }
      } catch {
        // mantém o histórico vazio
      }
    };

    carregarHistorico();
  }, [usuario]);

  const handleFotoPerfil = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fotoUrl) {
      URL.revokeObjectURL(fotoUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setFotoUrl(objectUrl);
    setFotoPerfil(objectUrl);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="px-4">
          {abaAtiva === "inicio" && (
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <h2 className="text-sm font-medium text-slate-500 mb-1">Usuário</h2>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {usuario?.nome_completo || "Carregando..."}
              </h1>
            </div>
          )}

          {abaAtiva === "inicio" && (
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
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
                  {encomendas.slice(0, encomendasPagina).map((encomenda) => {
                    const jaConfirmada = historico.some((h) => h.id === encomenda.id);

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
                  {encomendas.length > encomendasPagina && (
                    <button
                      onClick={() => setEncomendasPagina((p) => p + LIMITE_LISTA)}
                      className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Carregar mais
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "encomendas" && (
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Histórico de encomendas retiradas
              </h2>

              {historico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Nenhuma encomenda retirada no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historico.slice(0, historicoPagina).map((item) => (
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
                          <span className="text-slate-400">Chegou em</span>
                          <span className="font-medium text-slate-700">
                            {formatarData(item.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Retirada em</span>
                          <span className="font-medium text-slate-700">
                            {formatarData(item.retirado_em)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Retirado por</span>
                          <span className="font-medium text-slate-700">
                            {item.retirado_por}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {historico.length > historicoPagina && (
                    <button
                      onClick={() => setHistoricoPagina((p) => p + LIMITE_LISTA)}
                      className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Carregar mais
                    </button>
                  )}
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
                    id="foto-perfil"
                    onChange={handleFotoPerfil}
                  />
                  <label
                    htmlFor="foto-perfil"
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  {usuario?.nome_completo || "Carregando..."}
                </p>
                <p className="text-xs text-slate-400">
                  {usuario?.email}
                </p>
              </div>
              <div className="mt-6">
                <ReportarProblema
                  usuarioNome={usuario?.nome_completo || "Usuário"}
                  usuarioTipo={usuario?.tipo_usuario || "cliente"}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-sm mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => setAbaAtiva("inicio")}
            className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === "inicio" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Início</span>
          </button>
          <button
            onClick={() => setAbaAtiva("encomendas")}
            className={`flex flex-col items-center gap-1 p-2 ${abaAtiva === "encomendas" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs">Encomendas</span>
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
                onClick={handleLogout}
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