import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VersaoRemota {
  versao: string;
  forcarAtualizacao: boolean;
  mensagem: string;
  urlDownload: string;
}

export const useAtualizacoes = (versaoAtual: string) => {
  const [atualizacaoDisponivel, setAtualizacaoDisponivel] = useState(false);
  const [versaoRemota, setVersaoRemota] = useState<VersaoRemota | null>(null);
  const [carregando, setCarregando] = useState(true);

  const compararVersoes = (v1: string, v2: string): number => {
    const partes1 = v1.split(".").map(Number);
    const partes2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(partes1.length, partes2.length); i++) {
      const p1 = partes1[i] || 0;
      const p2 = partes2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  const verificarAtualizacao = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("chave", "versao_app")
        .maybeSingle();

      if (error || !data) {
        setCarregando(false);
        return;
      }

      const remota: VersaoRemota = {
        versao: data.versao,
        forcarAtualizacao: data.forcar_atualizacao || false,
        mensagem: data.mensagem || "Uma nova versão está disponível!",
        urlDownload: data.url_download || "https://play.google.com/store/apps/details?id=com.appoio.app",
      };

      setVersaoRemota(remota);

      const cmp = compararVersoes(versaoAtual, remota.versao);
      if (cmp < 0) {
        setAtualizacaoDisponivel(true);
      }
    } catch (err) {
      console.error("Erro ao verificar atualização:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    verificarAtualizacao();
  }, [versaoAtual]);

  return {
    atualizacaoDisponivel,
    versaoRemota,
    carregando,
    compararVersoes,
  };
};