import * as React from 'react';
import { useParams } from '@remix-run/react';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

export default function AppointmentForm() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [appointmentData, setAppointmentData] = React.useState(null);

  React.useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      try {
        const appointmentDoc = await getDoc(doc(db, 'pending_appointments', id));
        if (!appointmentDoc.exists()) {
          setError('Agendamento não encontrado');
          return;
        }
        setAppointmentData(appointmentDoc.data());
      } catch (error) {
        console.error('Erro ao carregar:', error);
        setError('Erro ao carregar dados do agendamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !appointmentData) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const clientName = formData.get("clientName")?.toString().trim();

      if (!clientName) {
        setError('Por favor, informe o nome do cliente');
        setIsLoading(false);
        return;
      }

      let startDate: Date;
      if (appointmentData.date instanceof Date) {
        startDate = appointmentData.date;
      } else if (appointmentData.date?.toDate) {
        startDate = appointmentData.date.toDate();
      } else {
        startDate = new Date();
      }

      const eventData = {
        title: clientName,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(new Date(startDate.getTime() + 60 * 60 * 1000)),
        clientName,
        carModel: formData.get("carModel")?.toString().trim() || '',
        licensePlate: formData.get("licensePlate")?.toString().trim() || '',
        serviceType: formData.get("serviceType")?.toString().trim() || '',
        observations: formData.get("observations")?.toString().trim() || '',
        createdBy: appointmentData.createdBy || {},
        status: 'confirmed',
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'events', id), eventData);
      await deleteDoc(doc(db, 'pending_appointments', id));
      window.location.href = '/agendamento-confirmado';
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError('Erro ao salvar agendamento. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-600 mt-2">
            Se o erro persistir, entre em contato com a LAPS
          </p>
        </div>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Dados do agendamento não encontrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <img src="/laps-logo.png" alt="LAPS" className="h-8 w-auto mr-3" />
          <h1 className="text-2xl font-semibold text-[#0047BB]">
            Agendar Serviço
          </h1>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Data/Hora: {appointmentData.date?.toDate().toLocaleString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

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
            <span className="block text-sm font-medium mb-1">Modelo do Carro</span>
            <Input 
              id="carModel" 
              name="carModel" 
              className="w-full"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Placa</span>
            <Input 
              id="licensePlate" 
              name="licensePlate" 
              className="w-full"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Tipo de Serviço</span>
            <Input 
              id="serviceType" 
              name="serviceType" 
              className="w-full"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Observações</span>
            <Textarea 
              id="observations" 
              name="observations" 
              rows={3} 
              className="w-full resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Confirmar Agendamento"}
          </Button>
        </form>
      </div>
    </div>
  );
}