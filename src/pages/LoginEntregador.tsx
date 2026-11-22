import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Copy, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const formatarCpf = (valor: string) => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
};

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
      navigate("/entregador-confirmar");
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
      console.log("Buscando CPF entregador:", digitosCpf);

      let { data: entregador, error } = await supabase
        .from("cadastros")
        .select("nome_completo, senha, cpf")
        .eq("cpf", digitosCpf)
        .maybeSingle();

      if (!entregador && !error) {
        const cpfFormatado = formatarCpf(digitosCpf);
        console.log("Tentando CPF formatado:", cpfFormatado);
        const resultado = await supabase
          .from("cadastros")
          .select("nome_completo, senha, cpf")
          .eq("cpf", cpfFormatado)
          .maybeSingle();
        entregador = resultado.data;
        error = resultado.error;
      }

      console.log("Resultado busca CPF entregador:", { entregador, error });

      if (error) {
        console.error("Erro Supabase busca CPF entregador:", error);
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
      // 1. Verificar se o entregador existe pelo nome
      const { data: entregador, error: erroEntregador } = await supabase
        .from("cadastros")
        .select("nome_completo, senha")
        .ilike("nome_completo", nome.trim())
        .maybeSingle();

      if (erroEntregador) {
        console.error("Erro Supabase login entregador:", erroEntregador);
        setErro("Erro ao fazer login. Tente novamente.");
        return;
      }

      if (!entregador) {
        setErro("Entregador não encontrado.");
        return;
      }

      // 2. Verificar se a senha está correta
      if (entregador.senha !== senha.trim()) {
        setErro("Senha incorreta.");
        return;
      }

      localStorage.setItem("entregador_nome", entregador.nome_completo);
      navigate("/entregador-confirmar");
    } catch (err) {
      console.error("Erro de conexão login entregador:", err);
      setErro("Houve um erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {modoBuscaCpf ? (
          <>
            <div className="text-center mb-8">
              <button
                type="button"
                onClick={voltarLoginNormal}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Buscar por CPF
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Digite seu CPF cadastrado
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); buscarPorCpf(); }}>
              {erro && <p className="text-sm text-destructive text-center">{erro}</p>}

              <div className="space-y-2">
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
            <div className="text-center mb-8">
              <button
                type="button"
                onClick={voltarLoginNormal}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Package className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Appoio
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Área de confirmação de entregas
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
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
                <p className="text-xs text-indigo-600 mt-2">
                  Nome copiado para o campo acima. Agora digite sua senha e entre.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Package className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Login Entregador
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Área de confirmação de entregas
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
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

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-slate-500 hover:text-slate-800"
                onClick={() => navigate("/esqueci-senha")}
              >
                Esqueceu sua senha?
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={() => navigate("/login")}
              >
                Login modo cliente
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginEntregador;