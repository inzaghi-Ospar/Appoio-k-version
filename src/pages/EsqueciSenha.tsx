import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErroEmail("Email inválido.");
      return;
    }
    setErroEmail("");
    setErroGeral("");
    setCarregando(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-senha`,
      });

      if (error) {
        setErroGeral(error.message || "Erro ao enviar email de recuperação.");
        return;
      }

      setEnviado(true);
    } catch (err: any) {
      setErroGeral(err?.message || "Erro inesperado. Tente novamente.");
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
            {enviado ? <Mail className="w-7 h-7" /> : <Package className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {enviado ? "Email enviado" : "Esqueci a senha"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {enviado
              ? "Verifique sua caixa de entrada e siga as instruções"
              : "Informe seu email para receber o link de recuperação"}
          </p>
        </div>

        {!enviado ? (
          <form className="space-y-4" onSubmit={handleEnviar}>
            {erroGeral && (
              <p className="text-sm text-destructive text-center">{erroGeral}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErroEmail("");
                }}
                className={erroEmail ? "border-destructive" : ""}
              />
              {erroEmail && <p className="text-sm text-destructive">{erroEmail}</p>}
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={carregando}>
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Se este email estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={() => navigate("/login")}
            >
              Voltar ao login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsqueciSenha;