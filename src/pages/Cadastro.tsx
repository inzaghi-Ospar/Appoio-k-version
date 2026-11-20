import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const formatarTelefone = (valor: string) => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

const formatarCpf = (valor: string) => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
};

const validarCpf = (cpf: string) => {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[10])) return false;

  return true;
};

const Cadastro = () => {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "entregador" | "">(");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let temErro = false;

    const partesNome = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    if (partesNome.length < 2) {
      setErroNome("Digite seu nome completo (nome e sobrenome).");
      temErro = true;
    } else {
      setErroNome("");
    }

    const digitosTelefone = telefone.replace(/\D/g, "");
    if (!/^\d{10,11}$/.test(digitosTelefone)) {
      setErroTelefone("Telefone em formato inválido. Ex: (21) 91234-5678");
      temErro = true;
    } else {
      setErroTelefone("");
    }

    const digitosCpf = cpf.replace(/\D/g, "");
    if (!validarCpf(digitosCpf)) {
      setErroCpf("CPF inválido. Digite um CPF válido.");
      temErro = true;
    } else {
      setErroCpf("");
    }

    if (senha.length < 4) {
      setErroSenha("A senha deve ter no mínimo 4 caracteres.");
      setErroConfirmarSenha("");
      temErro = true;
    } else if (senha !== confirmarSenha) {
      setErroSenha("");
      setErroConfirmarSenha("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      temErro = true;
    } else {
      setErroSenha("");
      setErroConfirmarSenha("");
    }

    if (!tipoUsuario) {
      setErroGeral("Selecione se é cliente ou entregador.");
      temErro = true;
    } else {
      setErroGeral("");
    }

    if (temErro) return;

    setErroGeral("");
    setCarregando(true);

    try {
      const { data: cpfExistente, error: erroConsultaCpf } = await supabase
        .from("cadastros")
        .select("id")
        .eq("cpf", cpf)
        .maybeSingle();

      if (erroConsultaCpf) {
        setErroGeral("Erro ao verificar cadastro. Tente novamente.");
        return;
      }

      const { data: nomeExistente, error: erroConsultaNome } = await supabase
        .from("cadastros")
        .select("id")
        .ilike("nome_completo", nomeCompleto.trim())
        .maybeSingle();

      if (erroConsultaNome) {
        setErroGeral("Erro ao verificar cadastro. Tente novamente.");
        return;
      }

      if (cpfExistente) {
        setErroCpf("Já existe um cadastro com este CPF.");
      }
      if (nomeExistente) {
        setErroNome("Já existe um cadastro com este nome.");
      }
      if (cpfExistente || nomeExistente) {
        return;
      }

      const { error: erroInsercao } = await supabase.from("cadastros").insert({
        nome_completo: nomeCompleto.trim(),
        telefone,
        cpf,
        senha,
        tipo_usuario: tipoUsuario,
      });

      if (erroInsercao) {
        setErroGeral("Erro ao criar cadastro. Tente novamente.");
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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Criar conta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Preencha seus dados para começar
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {erroGeral && (
            <p className="text-sm text-destructive text-center">{erroGeral}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome completo</Label>
            <Input
              id="nomeCompleto"
              placeholder="Digite seu nome completo"
              value={nomeCompleto}
              onChange={(e) => {
                setNomeCompleto(e.target.value);
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

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => {
                setTelefone(formatarTelefone(e.target.value));
                setErroTelefone("");
              }}
              className={erroTelefone ? "border-destructive" : ""}
            />
            {erroTelefone && (
              <p className="text-sm text-destructive">{erroTelefone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Crie sua senha"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErroSenha("");
              }}
              className={erroSenha ? "border-destructive" : ""}
            />
            {erroSenha && (
              <p className="text-sm text-destructive">{erroSenha}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              placeholder="Repita sua senha"
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

          <div className="space-y-2">
            <p className="text-sm text-slate-500 font-medium">Tipo de usuário</p>
            <div className="flex gap-4">
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${tipoUsuario === "cliente" ? "bg-indigo-100 text-indigo-600 border-indigo-500" : "border-slate-300 text-slate-500 hover:text-slate-700 transition-colors"}`}
                onClick={() => setTipoUsuario("cliente")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setTipoUsuario("cliente")}
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <User className="w-3 h-3" />
                </span>
                Cliente
              </label>

              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${tipoUsuario === "entregador" ? "bg-indigo-100 text-indigo-600 border-indigo-500" : "border-slate-300 text-slate-500 hover:text-slate-700 transition-colors"}`}
                onClick={() => setTipoUsuario("entregador")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setTipoUsuario("entregador")}
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Package className="w-3 h-3" />
                </span>
                Entregador
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={carregando}>
            {carregando ? "Verificando..." : "Confirmar cadastro"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;