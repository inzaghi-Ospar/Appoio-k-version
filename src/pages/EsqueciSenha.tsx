import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const digitosCpf = cpf.replace(/\D/g, "");
    if (!validarCpf(digitosCpf)) {
      setErroCpf("CPF inválido. Digite um CPF válido.");
      return;
    }

    setErroCpf("");
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4 mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Redefinição de senha
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enviamos um link para redefinir sua senha para o CPF informado.
          </p>

          <Button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full rounded-full mt-8"
          >
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <button
          type="button"
          onClick={() => navigate("/login")}
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
            Esqueci a senha
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Informe seu CPF para redefinir sua senha
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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

          <Button type="submit" className="w-full rounded-full">
            Redefinir senha
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EsqueciSenha;