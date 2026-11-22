import { useEffect, useNavigate } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const entregadorSalvo = localStorage.getItem("entregador_nome");
    if (entregadorSalvo) {
      navigate("/tela-entregas");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#F4F1EC] p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Bem-vindo ao Appoio
        </h1>
        <p className="text-base text-slate-500 max-w-xs">
          Gerencie seus pedidos, organize seu estoque e faça mais negócios de forma simples e rápida.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button
          type="button"
          className="w-full rounded-full"
          onClick={() => navigate("/cadastro")}
        >
          Criar conta
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-full"
          onClick={() => navigate("/login")}
        >
          Já tenho conta
        </Button>
      </div>
    </div>
  );
};

export default Welcome;