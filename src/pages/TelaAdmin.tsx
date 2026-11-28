import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/format";

interface Tentativa {
  id: string;
  usuario_nome_falhou: string | null;
  dispositivo_id: string | null;
  timestamp: string;
}

const TelaAdmin = () => {
  const navigate = useNavigate();
  const [tentativas, setTentativas] = useState<Tentativa[]>([]);
  const [usuario, setUsuario] = useState<{ id: string; nome_completo: string; email: string; is_admin: boolean } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        setUsuario({
          id: user.id,
          nome_completo: user.user_metadata?.nome_completo || user.email || "Admin",
          email: user.email || "",
          is_admin: user.user_metadata?.is_admin === true,
        });
      } else {
        setUsuario(null);
        navigate("/login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!usuario) return;

    const carregarTentativas = async () => {
      const { data } = await supabase
        .from("admin_tentativas")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);

      if (data) setTentativas(data);
      setCarregando(false);
    };

    carregarTentativas();

    const canal = supabase
      .channel("admin_tentativas_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_tentativas" },
        (payload) => {
          setTentativas((prev) => [payload.new as Tentativa, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!usuario || !usuario.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso negado</h1>
          <p className="text-sm text-slate-500 mb-6">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button
            type="button"
            className="w-full rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => navigate("/login")}
          >
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tela Admin
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tentativas de acesso falhas
          </h2>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : tentativas.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhuma tentativa de acesso registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {tentativas.map((tentativa) => (
                <div
                  key={tentativa.id}
                  className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {tentativa.usuario_nome_falhou || "Desconhecido"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tentou acessar o admin e falhou
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatarData(tentativa.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelaAdmin;