import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    // Adiciona uma entrada no histórico para "segurar" o botão de voltar
    window.history.pushState({ appoio: true }, "", window.location.href);

    const handlePopState = () => {
      // Tenta fechar o app (funciona em PWA / WebView)
      window.close();
      // Se o navegador bloquear o fechamento, mantém o usuário no login
      window.history.pushState({ appoio: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Appoio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recebimento de encomendas
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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

          <Button type="submit" className="w-full rounded-full">
            Entrar
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => navigate("/cadastro")}
          >
            Cadastrar
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-slate-500 hover:text-slate-800"
            onClick={() => navigate("/esqueci-senha")}
          >
            Esqueceu sua senha?
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;