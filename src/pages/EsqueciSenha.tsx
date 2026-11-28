import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatarCpf, validarCpf } from "@/lib/format";

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();

    let temErro = false;

    if (!nome.trim()) {
      setErroNome("Digite seu nome completo.");
      temErro = true;
    } else {
      setErroNome("");
    }

    const digitosCpf = cpf.replace(/\D/g, "");
    if (!validarCpf(digitosCpf)) {
      setErroCpf("CPF inválido. Digite um CPF válido.");
      temErro = true;
    } else {
      setErroCpf("");
    }

    if (temErro) return;

    setErroGeral("");
    setCarregando(true);

    try {
      const { data: registro, error } = await supabase
        .from("cadastros")
        .select("id, nome_completo, cpf")
        .eq("cpf", digitosCpf)
        .ilike("nome_completo", nome.trim())
        .maybeSingle();

      if (error) {
        setErroGeral("Erro ao verificar cadastro. Tente novamente.");
        return;
      }

      if (!registro) {
        setErroGeral("Não encontramos um cadastro com este CPF e nome. Verifique os dados informados.");
        return;
      }

      setVerificado(true);
    } catch {
      setErroGeral("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();

    const digitosCpf = cpf.replace(/\D/g, "");

    let temErro = false;

    if (novaSenha.length < 4) {
      setErroSenha("A senha deve ter no mínimo 4 caracteres.");
      temErro = true;
    } else {
      setErroSenha("");
    }

    if (novaSenha !== confirmarSenha) {
      setErroConfirmarSenha("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      temErro = true;
    } else {
      setErroConfirmarSenha("");
    }

    if (temErro) return;

    setErroGeral("");
    setCarregando(true);

    try {
      const { error } = await supabase
        .from("cadastros")
        .update({ senha: novaSenha })
        .eq("cpf", digitosCpf);

      if (error) {
        setErroGeral("Erro ao atualizar senha. Tente novamente.");
        return;
      }

      navigate("/login");
    } catch {
      setErroGeral("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {verificado ? "Redefinir senha" : "Esqueci a senha"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {verificado
              ? "Digite sua nova senha"
              : "Informe seu nome e CPF para redefinir sua senha"}
          </p>
        </div>

        {!verificado ? (
          <form className="space-y-4" onSubmit={handleVerificar}>
            {erroGeral && (
              <p className="text-sm text-destructive text-center">{erroGeral}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErroNome("");
                }}
                className={erroNome ? "border-destructive" : ""}
              />
              {erroNome && <p className="text-sm text-destructive">{erroNome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatarCpf(e.target.value));
                  setErroCpf("");
                }}
                className={erroCpf ? "border-destructive" : ""}
                maxLength={14}
              />
              {erroCpf && <p className="text-sm text-destructive">{erroCpf}</p>}
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={carregando}>
              {carregando ? "Verificando..." : "Verificar dados"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRedefinir}>
            {erroGeral && (
              <p className="text-sm text-destructive text-center">{erroGeral}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    setErroSenha("");
                  }}
                  className={erroSenha ? "border-destructive pr-10" : "pr-10"}
                />
                {erroSenha && (
                  <p className="text-sm text-destructive">{erroSenha}</p>
                )}
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1"
                >
                  {mostrarSenha ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita sua nova senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setErroConfirmarSenha("");
                }}
                className={erroConfirmarSenha ? "border-destructive" : ""}
              />
              {erroConfirmarSenha && (
                <p className="text-sm text-destructive">{erroConfirmarSenha}</p>
              )}
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={carregando}>
              {carregando ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EsqueciSenha;