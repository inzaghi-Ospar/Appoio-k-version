import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    window.history.pushState({ appoio: true }, "", window.location.href);

    const handlePopState = () => {
      window.close();
      window.history.pushState({ appoio: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const { data, error } = await supabase
        .from("cadastros")
        .select("nome_completo")
        .ilike("nome_completo", nome.trim())
        .eq("senha", senha)
        .maybeSingle();

      if (error || !data) {
        setErro("Nome ou senha incorretos.");
        return;
      }

      localStorage.setItem("usuario_nome", data.nome_completo);
      navigate("/");
    } catch {
      setErro("Erro ao fazer login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

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