import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { CalendarEvent } from "../types";
import { useState } from "react";
import { Printer } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: CalendarEvent | null;
}

export function EventDetailsModal({ isOpen, onClose, selectedEvent }: EventDetailsModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      await deleteDoc(doc(db, "events", selectedEvent.id));
      onClose();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
    }
  };

  const handlePrint = () => {
    if (!selectedEvent) return;
    
    const printContent = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; width: 50%; padding: 20px;">
        <h2>Detalhes do Agendamento</h2>
        <p><strong>Título:</strong> ${selectedEvent.title}</p>
        <p><strong>Cliente:</strong> ${selectedEvent.clientName || ''}</p>
        <p><strong>Modelo do Carro:</strong> ${selectedEvent.carModel || ''}</p>
        <p><strong>Placa:</strong> ${selectedEvent.licensePlate || ''}</p>
        <p><strong>Tipo de Serviço:</strong> ${selectedEvent.serviceType || ''}</p>
        <p><strong>Criado por:</strong> ${selectedEvent.createdBy.name}</p>
        <p><strong>Data e Hora:</strong> ${selectedEvent.start.toLocaleString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <div style="margin-top: 20px;">
          <h3>Observações:</h3>
          <p>${selectedEvent.observations || 'Nenhuma observação adicional.'}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white rounded-2xl">
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

              {selectedEvent.serviceType && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo de Serviço</h3>
                  <p className="mt-1">{selectedEvent.serviceType}</p>
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
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="rounded-full"
              >
                Deletar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="rounded-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}