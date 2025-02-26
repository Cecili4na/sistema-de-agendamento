import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { CalendarEvent } from "../types";
import { useState } from "react";
import { Printer, Edit } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: CalendarEvent | null;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventDetailsModal({ isOpen, onClose, selectedEvent, onEdit }: EventDetailsModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCancelEvent = async () => {
    if (!selectedEvent) return;
    try {
      await updateDoc(doc(db, "events", selectedEvent.id), {
        status: "canceled"
      });
      onClose();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao cancelar evento:", error);
    }
  };

  const handlePrint = () => {
    if (!selectedEvent) return;
    
    const renderServices = () => {
      if (!selectedEvent.services || selectedEvent.services.length === 0) return '';
      
      const servicesList = selectedEvent.services
        .map(service => `<li>${service.name}</li>`)
        .join('');
      
      return `
        <div style="border: 1px solid #000; padding: 8px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 12px;">Serviços:</h3>
          <ul style="padding-left: 20px; margin: 0; font-size: 11px;">
            ${servicesList}
          </ul>
        </div>
      `;
    };
   
    const additionalLines = Array(15)
      .fill('')
      .map(() => `<div style="border-bottom: 1px solid #ddd; height: 25px;"></div>`)
      .join('');
   
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }
          @media print {
            @page { 
              size: A4; 
              margin: 10mm; 
            }
            body { 
              font-size: 11pt; 
              line-height: 1.3; 
            }
          }
          body {
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            padding: 15px;
          }
        </style>
      </head>
      <body>
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <img src="/laps-logo.png" alt="LAPS Logo" style="height: 50px; max-width: 120px; object-fit: contain;" />
            <h1 style="margin: 0; font-size: 15px; text-align: right;">FICHA DE ATENDIMENTO</h1>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div style="width: 50%; margin-right: 5px;">
              <strong style="font-size: 11px;">Data: ____/____/________</strong>
            </div>
            <div style="width: 50%; text-align: right;">
              <strong style="font-size: 11px;">Hora: ____:____</strong>
            </div>
          </div>
        </div>
   
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
          <p style="margin-bottom: 5px;"><strong>Cliente:</strong> ${selectedEvent.clientName || ''}</p>
          <p style="margin-bottom: 5px;"><strong>Modelo do Carro:</strong> ${selectedEvent.carModel || ''}</p>
          <p style="margin-bottom: 5px;"><strong>Placa:</strong> ${selectedEvent.licensePlate || ''}</p>
          <p style="margin-bottom: 5px;"><strong>Telefone:</strong> ${selectedEvent.phone || ''}</p>
          <p style="margin-bottom: 5px;"><strong>CPF:</strong> ${selectedEvent.cpf || ''}</p>
          <p style="margin-bottom: 5px;"><strong>KM:</strong> </p>
        </div>
   
        ${renderServices()}
   
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 12px;">Observações:</h3>
          <p style="font-size: 11px;">${selectedEvent.observations || 'Nenhuma observação adicional.'}</p>
        </div>
   
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 12px;">Informações Adicionais:</h3>
          <div style="display: flex; flex-direction: column;">
            ${additionalLines}
          </div>
        </div>
   
     
      </body>
      </html>
    `;
   
    requestAnimationFrame(() => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Por favor, habilite pop-ups para imprimir');
        return;
      }
   
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      requestAnimationFrame(() => {
        printWindow.print();
        printWindow.close();
      });
    });
   };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white rounded-2xl sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Título</h3>
                <p className="mt-1">{selectedEvent.title}</p>
              </div>

              {selectedEvent.clientName && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <p className="mt-1">{selectedEvent.clientName}</p>
                </div>
              )}

              {selectedEvent.carModel && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Modelo do Carro</h3>
                  <p className="mt-1">{selectedEvent.carModel}</p>
                </div>
              )}

              {selectedEvent.licensePlate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Placa</h3>
                  <p className="mt-1">{selectedEvent.licensePlate}</p>
                </div>
              )}

              {selectedEvent.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                  <p className="mt-1">{selectedEvent.phone}</p>
                </div>
              )}

              {selectedEvent.cpf && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CPF</h3>
                  <p className="mt-1">{selectedEvent.cpf}</p>
                </div>
              )}

              {selectedEvent.serviceType && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo de Serviço</h3>
                  <p className="mt-1">{selectedEvent.serviceType}</p>
                </div>
              )}

              {selectedEvent.services && selectedEvent.services.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Serviços</h3>
                  <ul className="mt-1 list-disc pl-5">
                    {selectedEvent.services.map((service, index) => (
                      <li key={index}>{service.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEvent.observations && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Observações</h3>
                  <p className="mt-1">{selectedEvent.observations}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">Criado por</h3>
                <p className="mt-1">{selectedEvent.createdBy.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Data e Hora</h3>
                <p className="mt-1">
                  {selectedEvent.start.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {selectedEvent.status === "canceled" && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-red-600 font-medium">Este agendamento foi cancelado</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between w-full">
              {selectedEvent && selectedEvent.status !== "canceled" ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="rounded-full"
                >
                  Cancelar Agendamento
                </Button>
              ) : selectedEvent && selectedEvent.status === "canceled" ? (
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    if (!selectedEvent) return;
                    updateDoc(doc(db, "events", selectedEvent.id), {
                      status: "confirmed"
                    });
                    onClose();
                  }}
                  className="rounded-full bg-green-600 hover:bg-green-700"
                >
                  Reativar Agendamento
                </Button>
              ) : (
                <div></div>
              )}
      
            </div>
            
            <div className="flex justify-evenly w-full gap-3">
              <Button
                type="button"
                variant="default"
                onClick={() => onEdit && onEdit(selectedEvent!)}
                className="rounded-full bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="rounded-full flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento ficará marcado como cancelado e aparecerá em vermelho no calendário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelEvent} 
              className="bg-red-400 hover:bg-red-400 rounded-full"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}