import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportarProblemaProps {
  usuarioNome: string;
  usuarioTipo: "cliente" | "entregador";
}

const ReportarProblema = ({ usuarioNome, usuarioTipo }: ReportarProblemaProps) => {
  const abrirWhatsApp = () => {
    const numero = "5521988113464";
    const mensagem = encodeURIComponent(
      `Olá! Sou ${usuarioNome} (${usuarioTipo === "cliente" ? "Cliente" : "Entregador"}). Gostaria de reportar um problema ou fazer uma sugestão.`
    );
    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
      onClick={abrirWhatsApp}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Reportar problema ou sugestão
    </Button>
  );
};

export default ReportarProblema;
