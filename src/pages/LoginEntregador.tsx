import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Copy, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatarCpf } from "@/lib/format";

const LoginEntregador = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoBuscaCpf, setModoBuscaCpf] = useState(false);
  const [cpfBusca, setCpfBusca] = useState("");
  const [entregadorEncontradoCpf, setEntregadorEncontradoCpf] = useState<{ nome_completo: string; senha: string } | null>(null);
  const [buscandoCpf, setBuscandoCpf] = useState(false);
    const [cliquesIcone, setCliquesIcone] = useState(0);
    const [mostrarPopupAdmin, setMostrarPopupAdmin] = useState(false);
    const [codigoDigitado, setCodigoDigitado] = useState("");
    const [mensagemErroCodigo, setMensagemErroCodigo] = useState("");
  
    useEffect(() => {
    window.history.pushState({ appoio: true }, "", window.location.href);

    const handlePopState = () => {
      window.close();
      window.history.pushState({ appoio: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const entregadorSalvo = localStorage.getItem("entregador_nome");
    if (entregadorSalvo) {
      navigate("/tela-entregas");
    }
  }, [navigate]);

  const copiarNome = () => {
    if (entregadorEncontradoCpf) {
      navigator.clipboard.writeText(entregadorEncontradoCpf.nome_completo);
      setNome(entregadorEncontradoCpf.nome_completo);
      setModoBuscaCpf(false);
      setEntregadorEncontradoCpf(null);
      setCpfBusca("");
    }
  };

  const voltarLoginNormal = () => {
    setModoBuscaCpf(false);
    setEntregadorEncontradoCpf(null);
    setCpfBusca("");
    setErro("");
  };

  const buscarPorCpf = async () => {
    const digitosCpf = cpfBusca.replace(/\D/g, "");
    if (!digitosCpf || digitosCpf.length !== 11) {
      setErro("CPF inválido. Digite um CPF com 11 dígitos.");
      return;
    }

    setBuscandoCpf(true);
    setErro("");

    try {
      let { data: entregador, error } = await supabase
        .from("cadastros")
        .select("nome_completo, senha, cpf")
        .eq("cpf", digitosCpf)
        .maybeSingle();

      if (!entregador && !error) {
        const cpfFormatado = formatarCpf(digitosCpf);
        const resultado = await supabase
          .from("cadastros")
          .select("nome_completo, senha, cpf")
          .eq("cpf", cpfFormatado)
          .maybeSingle();
        entregador = resultado.data;
        error = resultado.error;
      }

      if (error) {
        setErro("Erro ao buscar por CPF. Tente novamente.");
        return;
      }

      if (!entregador) {
        setErro("Nenhum entregador encontrado com este CPF.");
        return;
      }

      setModoBuscaCpf(false);
      setEntregadorEncontradoCpf(entregador);
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setBuscandoCpf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const { data: entregador, error: erroEntregador } = await supabase
        .from("cadastros")
        .select("nome_completo, senha")
        .ilike("nome_completo", nome.trim())
        .limit(1)
        .maybeSingle();

      if (erroEntregador) {
        console.error("Erro Supabase login entregador:", erroEntregador);
        setErro(`Erro ao fazer login: ${erroEntregador.message || "Tente novamente."}`);
        return;
      }

      if (!entregador) {
        setErro("Entregador não encontrado.");
        return;
      }

      if (entregador.senha !== senha.trim()) {
        setErro("Senha incorreta.");
        return;
      }

      localStorage.setItem("entregador_nome", entregador.nome_completo);
      navigate("/tela-entregas");
    } catch (err: any) {
      console.error("Erro conexão login entregador:", err);
      setErro(`Houve um erro de conexão: ${err?.message || "Verifique sua internet e tente novamente."}`);
    } finally {
      setCarregando(false);
    }
  };

  const handleCliqueIcone = () => {
    const novoTotal = cliquesIcone + 1;
    if (novoTotal >= 10) {
      setCliquesIcone(0);
      setMostrarPopupAdmin(true);
      setCodigoDigitado("");
      setMensagemErroCodigo("");
    } else {
      setCliquesIcone(novoTotal);
    }
  };

  const verificarCodigoAdmin = async () => {
    if (codigoDigitado === "0127183876116669674759") {
      setMostrarPopupAdmin(false);
      setCodigoDigitado("");
      setMensagemErroCodigo("");
      navigate("/tela-admin");
      return;
    }

    const usuarioLogado =
      localStorage.getItem("usuario_nome") ||
      localStorage.getItem("entregador_nome") ||
      "Desconhecido";

    try {
      await supabase.from("admin_tentativas").insert({
        usuario_nome_falhou: usuarioLogado,
        dispositivo_id: navigator.userAgent,
      });
    } catch (err) {
      console.error("Erro ao registrar tentativa:", err);
    }

    setMensagemErroCodigo("Código incorreto.");
    setCodigoDigitado("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
        {modoBuscaCpf ? (
          <>
            <div className="text-center mb-5">
              <button
                type="button"
                onClick={voltarLoginNormal}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Buscar por CPF
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Digite seu CPF cadastrado
              </p>
            </div>

            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); buscarPorCpf(); }}>
              {erro && <p className="text-sm text-destructive text-center">{erro}</p>}

              <div className="space-y-1.5">
                <Label htmlFor="cpfBusca">CPF</Label>
                <Input
                  id="cpfBusca"
                  placeholder="000.000.000-00"
                  value={cpfBusca}
                  onChange={(e) => setCpfBusca(formatarCpf(e.target.value))}
                  maxLength={14}
                />
              </div>

              <Button type="submit" className="w-full rounded-full" disabled={buscandoCpf}>
                {buscandoCpf ? "Buscando..." : "Buscar entregador"}
              </Button>
            </form>
          </>
        ) : entregadorEncontradoCpf ? (
          <>
            <div className="text-center mb-5">
              <button
                type="button"
                onClick={voltarLoginNormal}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Appoio
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Área de confirmação de entregas
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    Entregador encontrado:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-indigo-700 truncate">
                    {entregadorEncontradoCpf.nome_completo}
                  </span>
                  <button
                    type="button"
                    onClick={copiarNome}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="Copiar nome"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-full" disabled={carregando}>
                {carregando ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-3 cursor-pointer hover:bg-indigo-200 transition-colors" onClick={handleCliqueIcone}>
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Login Entregador
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Área de confirmação de entregas
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {erro && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive text-center">{erro}</p>
                  {erro === "Entregador não encontrado." && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => setModoBuscaCpf(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Tentar login com CPF?
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-full" disabled={carregando}>
                {carregando ? "Entrando..." : "Entrar"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/login")}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => navigate("/login")}
                >
                  Login Normal
                </Button>
              </div>

              <Button
                              type="button"
                              variant="ghost"
                              className="w-full text-sm text-slate-500 hover:text-slate-800"
                              onClick={() => navigate("/esqueci-senha")}
                            >
                              Esqueceu sua senha?
                            </Button>
                          </form>
                          {mostrarPopupAdmin && (
                            <div
                              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                            >
                              <div
                                className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h2 className="text-xl font-bold text-slate-900 mb-4">
                                  Acesso ao Admin
                                </h2>
                                <p className="text-sm text-slate-500 mb-6">
                                  Digite o código numérico para acessar o painel administrativo:
                                </p>
                                <div className="space-y-4">
                                  <div>
                                    <label htmlFor="codigo" className="block text-sm font-medium text-slate-700 mb-2">
                                      Código
                                    </label>
                                    <Input
                                                                          id="codigo"
                                                                          value={codigoDigitado}
                                                                          onChange={(e) => setCodigoDigitado(e.target.value)}
                                                                          maxLength={20}
                                                                          className={mensagemErroCodigo ? "border-destructive" : ""}
                                                                        />
                                    {mensagemErroCodigo && (
                                      <p className="text-sm text-destructive mt-2">{mensagemErroCodigo}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-3">
                                    <Button
                                      type="button"
                                      onClick={verificarCodigoAdmin}
                                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!codigoDigitado}
                                    >
                                      Confirmar
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => setMostrarPopupAdmin(false)}
                                      className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
};

export default LoginEntregador;