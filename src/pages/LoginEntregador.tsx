import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginEntregador = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    // Simular login de entregador (em desenvolvimento)
    setTimeout(() => {
      if (nome && senha) {
        localStorage.setItem("entregador_nome", nome);
        navigate("/entregador-confirmar");
      } else {
        setErro("Preencha nome e senha.");
      }
      setCarregando(false);
    }, 500);
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Login Entregador
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Área de confirmação de entregas
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {erro && <p className="text-sm text-destructive text-center">{erro}</p>}

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
            <Input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-slate-500 hover:text-slate-800"
            onClick={() => navigate("/login")}
          >
            Cancelar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginEntregador;