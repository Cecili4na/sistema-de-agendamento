import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Plus, X } from "lucide-react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CalendarEvent } from "../types";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  userData: { uid: string; name: string; } | null;
  eventToEdit?: CalendarEvent | null;
}

export default function EventFormModal({
  isOpen,
  onClose,
  selectedDate,
  userData,
  eventToEdit
}: EventFormModalProps) {
  const [mode, setMode] = useState<"select" | "form" | "link">("select");
  const [appointmentLink, setAppointmentLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([{ name: '' }]);

  useEffect(() => {
    if (eventToEdit) {
      setMode("form");
      if (eventToEdit.services && eventToEdit.services.length > 0) {
        setServices(eventToEdit.services);
      }
    } else {
      if (!isOpen) {
        setMode("select");
        setServices([{ name: '' }]);
      }
    }
  }, [eventToEdit, isOpen]);

  const handleClose = () => {
    setMode("select");
    setAppointmentLink("");
    setIsLoading(false);
    setServices([{ name: '' }]);
    onClose();
  };

  const addService = () => {
    setServices([...services, { name: '' }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: string, value: string) => {
    const newServices = services.map((service, i) => {
      if (i === index) {
        return { ...service, [field]: value };
      }
      return service;
    });
    setServices(newServices);
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
      const eventId = eventToEdit ? eventToEdit.id : crypto.randomUUID();
      
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
        phone: formData.get("phone")?.toString() || "",
        cpf: formData.get("cpf")?.toString() || "",
        serviceType: formData.get("serviceType")?.toString() || "",
        services: services.filter(service => service.name.trim() !== ''),
        observations: formData.get("observations")?.toString() || "",
        createdBy: {
          uid: userData.uid,
          name: userData.name
        },
        status: eventToEdit?.status || "confirmed",
        createdAt: eventToEdit ? eventToEdit.createdAt : Timestamp.fromDate(new Date())
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

        {mode === "select" && !eventToEdit && (
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

        {(mode === "form" || eventToEdit) && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{eventToEdit ? "Editar Agendamento" : "Novo Agendamento"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="block text-sm font-medium mb-1">
                  Nome do Cliente <span className="text-red-500">*</span>
                </span>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  className="w-full"
                  defaultValue={eventToEdit?.clientName || ""}
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
                  defaultValue={eventToEdit?.carModel || ""}
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
                  defaultValue={eventToEdit?.licensePlate || ""}
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  Telefone
                </span>
                <Input 
                  id="phone" 
                  name="phone" 
                  className="w-full"
                  defaultValue={eventToEdit?.phone || ""}
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1">
                  CPF
                </span>
                <Input 
                  id="cpf" 
                  name="cpf" 
                  className="w-full"
                  defaultValue={eventToEdit?.cpf || ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium">Serviços</span>
                  <Button
                    type="button"
                    onClick={addService}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                
                {services.map((service, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-md">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nome do serviço"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    {services.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeService(index)}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
                  defaultValue={eventToEdit?.observations || ""}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Salvando..." : eventToEdit ? "Atualizar" : "Salvar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  className="flex-1"
                >
                  Cancelar
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