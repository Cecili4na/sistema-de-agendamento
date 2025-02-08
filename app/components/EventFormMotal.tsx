import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { X } from "lucide-react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  userData: { uid: string; name: string; } | null;
}

export default function EventFormModal({
  isOpen,
  onClose,
  selectedDate,
  userData
}: EventFormModalProps) {
  const [mode, setMode] = useState<"select" | "form" | "link">("select");
  const [appointmentLink, setAppointmentLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setMode("select");
    setAppointmentLink("");
    setIsLoading(false);
    onClose();
  };

  const generateAppointmentLink = async () => {
    if (!selectedDate || !userData) return;
    
    setIsLoading(true);
    try {
      const appointmentId = crypto.randomUUID();
      
      await setDoc(doc(db, "pending_appointments", appointmentId), {
        date: Timestamp.fromDate(selectedDate),
        status: "pending",
        createdBy: {
          uid: userData.uid,
          name: userData.name
        },
        createdAt: Timestamp.fromDate(new Date())
      });
      
      const link = `${window.location.origin}/agendar/${appointmentId}`;
      setAppointmentLink(link);
    } catch (error) {
      console.error("Erro ao gerar link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate || !userData) return;

    const formData = new FormData(e.currentTarget);
    const clientName = formData.get("clientName")?.toString();

    if (!clientName) {
      alert("Nome do cliente é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      const eventId = crypto.randomUUID();
      
      const eventData = {
        id: eventId,
        title: formData.get("carModel") 
          ? `${clientName} - ${formData.get("carModel")}`
          : clientName,
        start: Timestamp.fromDate(selectedDate),
        end: Timestamp.fromDate(new Date(selectedDate.getTime() + 60 * 60 * 1000)),
        clientName: clientName,
        carModel: formData.get("carModel")?.toString() || "",
        licensePlate: formData.get("licensePlate")?.toString() || "",
        serviceType: formData.get("serviceType")?.toString() || "",
        observations: formData.get("observations")?.toString() || "",
        createdBy: {
          uid: userData.uid,
          name: userData.name
        },
        status: "confirmed",
        createdAt: Timestamp.fromDate(new Date())
      };

      await setDoc(doc(db, "events", eventId), eventData);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appointmentLink);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogClose>

        {mode === "select" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Novo Agendamento</h2>
            <p className="text-gray-600">
              Como deseja prosseguir com o agendamento para{" "}
              {selectedDate?.toLocaleDateString("pt-BR", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}?
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setMode("form")} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Preencher Agora
              </Button>
              <Button 
                onClick={() => {
                  setMode("link");
                  generateAppointmentLink();
                }} 
                variant="outline" 
                className="w-full"
              >
                Gerar Link para Cliente
              </Button>
            </div>
          </div>
        )}

        {mode === "form" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Novo Agendamento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="block text-sm font-medium mb-1">
                  Nome do Cliente <span className="text-red-500">*</span>
                </span>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  className="w-full"
                  required
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  Modelo do Carro
                </span>
                <Input 
                  id="carModel" 
                  name="carModel" 
                  className="w-full"
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  Placa
                </span>
                <Input 
                  id="licensePlate" 
                  name="licensePlate" 
                  className="w-full"
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  Tipo de Serviço
                </span>
                <Input 
                  id="serviceType" 
                  name="serviceType" 
                  className="w-full"
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  Observações
                </span>
                <Textarea 
                  id="observations" 
                  name="observations" 
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMode("select")} 
                  className="flex-1"
                >
                  Voltar
                </Button>
              </div>
            </form>
          </div>
        )}

        {mode === "link" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Link Gerado</h2>
            
            {isLoading ? (
              <div className="text-center py-4">
                <p>Gerando link...</p>
              </div>
            ) : appointmentLink ? (
              <>
                <div className="bg-gray-50 p-3 rounded-md break-all border">
                  {appointmentLink}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={copyToClipboard} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Copiar Link
                  </Button>
                  <Button 
                    onClick={() => setMode("select")} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-500">Erro ao gerar link. Tente novamente.</p>
                <Button 
                  onClick={() => setMode("select")} 
                  variant="outline" 
                  className="mt-4"
                >
                  Voltar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}