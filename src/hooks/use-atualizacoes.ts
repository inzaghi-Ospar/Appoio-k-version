import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

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
  }, [versaoAtual, compararVersoes]);

  const baixarEInstalar = useCallback(async () => {
    const url = estado.urlDownload;
    const versao = estado.versaoRemota;

    if (!url || !versao) {
      setEstado((prev) => ({ ...prev, status: "erro", erro: "URL de download inválida" }));
      return;
    }

    setEstado((prev) => ({ ...prev, status: "baixando", progresso: 0, erro: null }));

    try {
      const resposta = await fetch(url);

      if (!resposta.ok || !resposta.body) {
        throw new Error("Falha ao baixar a atualização");
      }

      const tamanhoTotal = resposta.headers.get("content-length");
      const total = tamanhoTotal ? parseInt(tamanhoTotal, 10) : 0;
      const leitor = resposta.body.getReader();
      const chunks: Uint8Array[] = [];
      let recebido = 0;

      while (true) {
        const { done, value } = await leitor.read();

        if (done) break;

        chunks.push(value!);
        recebido += value!.length;

        if (total > 0) {
          const percentual = Math.round((recebido / total) * 100);
          setEstado((prev) => ({ ...prev, progresso: percentual }));
        }
      }

      const blob = new Blob(chunks as unknown as BlobPart[]);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const nomeArquivo = `appoio-${versao}.apk`;

      const texto = String.fromCharCode(...bytes);
      const base64 = btoa(texto);

      await Filesystem.writeFile({
        path: nomeArquivo,
        data: base64,
        directory: Directory.Documents,
        encoding: Encoding.Utf8,
      });

      setEstado((prev) => ({ ...prev, status: "pronto", progresso: 100 }));

      // Tentar abrir o APK para instalação
      try {
        const { uri } = await Filesystem.getUri({
          path: nomeArquivo,
          directory: Directory.Documents,
        });

        window.open(`file://${uri}`, "_blank");
      } catch (err) {
        console.error("Erro ao abrir APK:", err);
        window.open(url, "_blank");
      }
    } catch (err: any) {
      console.error("Erro ao baixar atualização:", err);
      setEstado((prev) => ({
        ...prev,
        status: "erro",
        erro: err.message || "Erro ao baixar atualização",
      }));
    }
  }, [estado.urlDownload, estado.versaoRemota]);

  useEffect(() => {
    verificarAtualizacao();
  }, [verificarAtualizacao]);

  return {
    ...estado,
    atualizacaoDisponivel: estado.status === "disponivel",
    carregando: estado.status === "verificando" || estado.status === "baixando",
    verificarAtualizacao,
    baixarEInstalar,
  };
};