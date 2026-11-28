import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const Welcome = lazy(() => import("./pages/Welcome"));
const LoginEntregador = lazy(() => import("./pages/LoginEntregador"));
const TelaEntregas = lazy(() => import("./pages/TelaEntregas"));
const TelaAdmin = lazy(() => import("./pages/TelaAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
import AtualizacaoDialog from "@/components/AtualizacaoDialog";
import { DownloadProgresso } from "@/components/DownloadProgresso";
import { useAtualizacoes } from "@/hooks/use-atualizacoes";
import { supabase } from "@/integrations/supabase/client";

const VERSAO_ATUAL = "0.1.0";

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigate based on auth state change
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/tela-inicial");
      } else {
        navigate("/login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="animate-page">
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes location={location}>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-entregador" element={<LoginEntregador />} />
          <Route path="/tela-entregas" element={<TelaEntregas />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/tela-inicial" element={<Index />} />
          <Route path="/tela-admin" element={<TelaAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => {
  const { atualizacaoDisponivel, versaoRemota, carregando, mensagem, forcarAtualizacao, urlDownload: urlDownloadRemoto } = useAtualizacoes(VERSAO_ATUAL);
  const [dispensado, setDispensado] = useState(false);
  const [mostrarDownload, setMostrarDownload] = useState(false);
  const [urlDownload, setUrlDownload] = useState("");

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setUrlDownload(e.detail.url);
      setMostrarDownload(true);
    };
    window.addEventListener("iniciar-download", handler as EventListener);
    return () => window.removeEventListener("iniciar-download", handler as EventListener);
  }, []);

  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <AtualizacaoDialog
        aberto={!carregando && atualizacaoDisponivel && !dispensado}
        versaoAtual={VERSAO_ATUAL}
        versaoRemota={versaoRemota || ""}
        mensagem={mensagem || "Uma nova versão está disponível!"}
        forcarAtualizacao={forcarAtualizacao || false}
        urlDownload={urlDownloadRemoto || "https://play.google.com/store/apps/details?id=com.appoio.app"}
        onFechar={() => setDispensado(true)}
      />
      {mostrarDownload && (
        <DownloadProgresso
          url={urlDownload}
          onFechar={() => setMostrarDownload(false)}
          onInstalado={() => setMostrarDownload(false)}
        />
      )}
    </BrowserRouter>
  );
};

export default App;