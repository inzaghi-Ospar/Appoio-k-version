import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Copy, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatarCpf } from "@/lib/format";
import {
  getRateLimitRemainingMs,
  recordAttempt,
  clearAttempts,
  formatWaitTime,
  RATE_LIMITS,
} from "@/lib/rate-limit";

const LoginEntregador = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoBuscaCpf, setModoBuscaCpf] = useState(false);
  const [cpfBusca, setCpfBusca] = useState("");
  const [entregadorEncontradoCpf, setEntregadorEncontradoCpf] = useState<{ nome_completo: string } | null>(null);
  const [buscandoCpf, setBuscandoCpf] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/tela-entregas");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const copiarNome = () => {
    if (entregadorEncontradoCpf) {
      navigator.clipboard.writeText(entregadorEncontradoCpf.nome_completo);
      setEmail(entregadorEncontradoCpf.nome_completo);
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
  
      const rlKey = `cpf-search:${digitosCpf}`;
      const waitMs = getRateLimitRemainingMs(rlKey, RATE_LIMITS.cpfSearch);
      if (waitMs > 0) {
        setErro(`Muitas tentativas. Tente novamente em ${formatWaitTime(waitMs)}.`);
        return;
      }
  
      setBuscandoCpf(true);
      setErro("");
  
      try {
        let entregador: { nome_completo: string; cpf?: string } | null = null;
        const { data: entregadorData, error } = await supabase
          .from("cadastros")
          .select("nome_completo, cpf")
          .eq("cpf", digitosCpf)
          .maybeSingle();
  
        entregador = entregadorData;
  
        if (error) {
          setErro("Erro ao buscar por CPF. Tente novamente.");
          return;
        }
  
        if (!entregador) {
          const cpfFormatado = formatarCpf(digitosCpf);
          const resultado = await supabase
            .from("cadastros")
            .select("nome_completo, cpf")
            .eq("cpf", cpfFormatado)
            .maybeSingle();
          entregador = resultado.data;
        }
  
        if (!entregador) {
          recordAttempt(rlKey, RATE_LIMITS.cpfSearch);
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
  
      const rlKey = `login:${email.trim().toLowerCase()}`;
      const waitMs = getRateLimitRemainingMs(rlKey, RATE_LIMITS.login);
      if (waitMs > 0) {
        setErro(`Muitas tentativas de login. Tente novamente em ${formatWaitTime(waitMs)}.`);
        setCarregando(false);
        return;
      }
  
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
  
        if (error) {
          recordAttempt(rlKey, RATE_LIMITS.login);
          setErro("Email ou senha incorretos.");
          return;
        }
  
        clearAttempts(rlKey);
        navigate("/tela-entregas");
      } catch (err: any) {
        console.error("Erro conexão login entregador:", err);
        setErro(`Houve um erro de conexão: ${err?.message || "Verifique sua internet e tente novamente."}`);
      } finally {
        setCarregando(false);
      }
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-3">
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
              {erro && <p className="text-sm text-destructive text-center">{erro}</p>}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default LoginEntregador;