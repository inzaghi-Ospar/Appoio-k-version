import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import Welcome from "./pages/Welcome";
import LoginEntregador from "./pages/LoginEntregador";
import TelaEntregas from "./pages/TelaEntregas";
import NotFound from "./pages/NotFound";
import AtualizacaoDialog from "@/components/AtualizacaoDialog";
import { useAtualizacoes } from "@/hooks/use-atualizacoes";

const queryClient = new QueryClient();

const VERSAO_ATUAL = "0.0.0";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page">
      <Routes location={location}>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
                <Route path="/login-entregador" element={<LoginEntregador />} />
                <Route path="/tela-entregas" element={<TelaEntregas />} />
                <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/tela-inicial" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const { atualizacaoDisponivel, versaoRemota, carregando } = useAtualizacoes(VERSAO_ATUAL);
  const [dispensado, setDispensado] = useState(false);

  const mostrarDialog =
    !carregando && atualizacaoDisponivel && !dispensado;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
        <AtualizacaoDialog
          aberto={mostrarDialog}
          versaoAtual={VERSAO_ATUAL}
          versaoRemota={versaoRemota?.versao || ""}
          mensagem={versaoRemota?.mensagem || "Uma nova versão está disponível!"}
          forcarAtualizacao={versaoRemota?.forcarAtualizacao || false}
          urlDownload={versaoRemota?.urlDownload || "https://play.google.com/store/apps/details?id=com.appoio.app"}
          onFechar={() => setDispensado(true)}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;