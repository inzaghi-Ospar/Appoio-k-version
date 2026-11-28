import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ResetSenha = () => {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState("");
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sessaoValida, setSessaoValida] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessaoValida(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessaoValida(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) {
        setErroGeral(error.message || "Erro ao redefinir senha.");
        return;
      }

      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      setErroGeral(err?.message || "Erro inesperado. Tente novamente.");
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Redefinir senha
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Digite sua nova senha
          </p>
        </div>

        {!sessaoValida ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive text-center">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={() => navigate("/esqueci-senha")}
            >
              Solicitar novo link
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1"
                >
                  {mostrarSenha ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {erroSenha && <p className="text-sm text-destructive">{erroSenha}</p>}
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

export default ResetSenha;