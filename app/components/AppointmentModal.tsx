// components/AppointmentModal.tsx
import { useState } from 'react';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  userData: { uid: string; name: string; } | null;
}

export function AppointmentModal({
  isOpen,
  onClose,
  selectedDate,
  userData
}: AppointmentModalProps) {
  const [mode, setMode] = useState<'select' | 'form' | 'link'>('select');
  const [appointmentLink, setAppointmentLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gera link para o cliente
  const generateAppointmentLink = async () => {
    if (!selectedDate || !userData) return;
    
    setIsLoading(true);
    try {
      const appointmentId = crypto.randomUUID();
      
      await setDoc(doc(db, 'pending_appointments', appointmentId), {
        date: selectedDate,
        status: 'pending',
        createdBy: userData.uid,
        createdAt: new Date(),
      });
      
      const link = `${window.location.origin}/agendar/${appointmentId}`;
      setAppointmentLink(link);
    } catch (error) {
      console.error('Erro ao gerar link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Para o preenchimento direto
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate || !userData) return;

    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const eventId = crypto.randomUUID();
      
      const eventData = {
        id: eventId,
        title: `${formData.get('clientName')} - ${formData.get('carModel')}`,
        start: selectedDate,
        end: new Date(selectedDate.getTime() + 60 * 60 * 1000),
        clientName: formData.get('clientName'),
        carModel: formData.get('carModel'),
        licensePlate: formData.get('licensePlate'),
        serviceType: formData.get('serviceType'),
        observations: formData.get('observations'),
        createdBy: userData.uid,
        status: 'confirmed'
      };

      await setDoc(doc(db, 'events', eventId), eventData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appointmentLink);
  };

  // Tela de seleção do modo
  if (mode === 'select') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
              <h2 className="text-xl font-semibold">Novo Agendamento</h2>
              <p className="text-gray-600">
                Como deseja prosseguir com o agendamento?
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setMode('form')} 
                  className="w-full"
                >
                  Preencher Agora
                </Button>
                <Button 
                  onClick={() => {
                    setMode('link');
                    generateAppointmentLink();
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  Gerar Link para Cliente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  // Formulário para preenchimento direto
  if (mode === 'form') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Novo Agendamento</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input id="clientName" name="clientName" required />
                </div>

                <div>
                  <Label htmlFor="carModel">Modelo do Carro</Label>
                  <Input id="carModel" name="carModel" required />
                </div>

                <div>
                  <Label htmlFor="licensePlate">Placa</Label>
                  <Input id="licensePlate" name="licensePlate" required />
                </div>

                <div>
                  <Label htmlFor="serviceType">Tipo de Serviço</Label>
                  <Input id="serviceType" name="serviceType" required />
                </div>

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea id="observations" name="observations" rows={3} />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setMode('select')} 
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  // Tela do link gerado
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Link Gerado</h2>
            
            {isLoading ? (
              <p>Gerando link...</p>
            ) : (
              <>
                <div className="bg-gray-50 p-3 rounded-md break-all">
                  {appointmentLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="flex-1">
                    Copiar Link
                  </Button>
                  <Button 
                    onClick={() => setMode('select')} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}