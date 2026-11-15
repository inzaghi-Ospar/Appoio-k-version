import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatarTelefone = (valor: string) => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

const Cadastro = () => {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let temErro = false;

    const partesNome = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    if (partesNome.length < 2) {
      setErroNome("Digite seu nome completo (nome e sobrenome).");
      temErro = true;
    } else {
      setErroNome("");
    }

    const digitos = telefone.replace(/\D/g, "");
    if (!/^\d{10,11}$/.test(digitos)) {
      setErroTelefone("Telefone em formato inválido. Ex: (21) 91234-5678");
      temErro = true;
    } else {
      setErroTelefone("");
    }

    if (senha.length < 4) {
          setErroSenha("A senha deve ter no mínimo 4 caracteres.");
          temErro = true;
        } else if (senha !== confirmarSenha) {
          setErroSenha("As senhas não coincidem. Digite a mesma senha nos dois campos.");
          temErro = true;
        } else {
          setErroSenha("");
        }

    if (temErro) return;

    // Aqui entra a função de cadastro (ainda não implementada)
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
            />
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
                setErroSenha("");
              }}
              className={erroSenha ? "border-destructive" : ""}
            />
            {erroSenha && (
              <p className="text-sm text-destructive">{erroSenha}</p>
            )}
          </div>

          <Button type="submit" className="w-full rounded-full">
            Confirmar cadastro
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;