import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VersaoRemota {
  versao: string;
  forcarAtualizacao: boolean;
  mensagem: string;
  urlDownload: string;
}

type StatusAtualizacao = "ocioso" | "verificando" | "disponivel" | "baixando" | "pronto" | "erro";

interface EstadoAtualizacao {
  status: StatusAtualizacao;
  progresso: number;
  versaoAtual: string;
  versaoRemota: string | null;
  mensagem: string;
  forcarAtualizacao: boolean;
  urlDownload: string;
  erro: string | null;
}

// Função de comparação de versão movida para nível de módulo
// Isso evita que a função seja recriada a cada render do hook,
// prevenindo o usoEffect de disparar a cada render (gargalo de CPU)
export const compararVersoes = (v1: string, v2: string): number => {
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

export const useAtualizacoes = (versaoAtual: string) => {
  const [estado, setEstado] = useState<EstadoAtualizacao>({
    status: "ocioso",
    progresso: 0,
    versaoAtual,
    versaoRemota: null,
    mensagem: "",
    forcarAtualizacao: false,
    urlDownload: "",
    erro: null,
  });

  const verificarAtualizacao = useCallback(async () => {
    setEstado((prev) => ({ ...prev, status: "verificando", erro: null }));

    try {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("chave", "versao_app")
        .maybeSingle();

      if (error || !data) {
        setEstado((prev) => ({ ...prev, status: "ocioso" }));
        return;
      }

      const remota: VersaoRemota = {
        versao: data.versao,
        forcarAtualizacao: data.forcar_atualizacao || false,
        mensagem: data.mensagem || "Uma nova versão está disponível!",
        urlDownload: data.url_download || "",
      };

      const cmp = compararVersoes(versaoAtual, remota.versao);

      if (cmp < 0) {
        setEstado({
          status: "disponivel",
          progresso: 0,
          versaoAtual,
          versaoRemota: remota.versao,
          mensagem: remota.mensagem,
          forcarAtualizacao: remota.forcarAtualizacao,
          urlDownload: remota.urlDownload,
          erro: null,
        });
      } else {
        setEstado({
          status: "ocioso",
          progresso: 0,
          versaoAtual,
          versaoRemota: remota.versao,
          mensagem: "",
          forcarAtualizacao: false,
          urlDownload: "",
          erro: null,
        });
      }
    } catch (err) {
      console.error("Erro ao verificar atualização:", err);
      setEstado((prev) => ({
        ...prev,
        status: "ocioso",
        erro: "Erro ao verificar atualização",
      }));
    }
  }, [versaoAtual]);

  useEffect(() => {
    verificarAtualizacao();
  }, [verificarAtualizacao]);

  return {
    ...estado,
    atualizacaoDisponivel: estado.status === "disponivel",
    carregando: estado.status === "verificando" || estado.status === "baixando",
    verificarAtualizacao,
  };
};