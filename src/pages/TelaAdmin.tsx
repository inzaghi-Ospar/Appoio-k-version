import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface Tentativa {
  id: string;
  usuario_nome_falhou: string | null;
  dispositivo_id: string | null;
  timestamp: string;
}

const TelaAdmin = () => {
  const [tentativas, setTentativas] = useState<Tentativa[]>([]);

  useEffect(() => {
    const carregarTentativas = async () => {
      const { data } = await supabase
        .from("admin_tentativas")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);

      if (data) setTentativas(data);
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
  }, []);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC] p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tela Admin
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tentativas de acesso falhas
          </h2>

          {tentativas.length === 0 ? (
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
