import * as React from 'react';
import { useParams } from '@remix-run/react';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Plus, X } from 'lucide-react';

export default function AppointmentForm() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [appointmentData, setAppointmentData] = React.useState(null);
  const [services, setServices] = React.useState([{ name: '' }]);

  React.useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      try {
        const appointmentDoc = await getDoc(doc(db, 'pending_appointments', id));
        if (!appointmentDoc.exists()) {
          setError('Agendamento não encontrado');
          return;
        }

        const data = appointmentDoc.data();
        if (data.date && typeof data.date.toDate === 'function') {
          data.date = data.date.toDate();
        }
        setAppointmentData(data);
      } catch (error) {
        console.error('Erro ao carregar:', error);
        setError('Erro ao carregar dados do agendamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const addService = () => {
    setServices([...services, { name: '' }]);
  };

  const removeService = (index) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index, field, value) => {
    const newServices = services.map((service, i) => {
      if (i === index) {
        return { ...service, [field]: value };
      }
      return service;
    });
    setServices(newServices);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !appointmentData) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const clientName = formData.get("clientName")?.toString().trim();
      const carModel = formData.get("carModel")?.toString().trim();
      const licensePlate = formData.get("licensePlate")?.toString().trim();
      const phone = formData.get("phone")?.toString().trim();
      const cpf = formData.get("cpf")?.toString().trim();
      const observations = formData.get("observations")?.toString().trim();

      const startDate = appointmentData.date instanceof Date 
        ? appointmentData.date 
        : appointmentData.date.toDate();

      const eventData = {
        title: carModel 
          ? `${clientName} - ${carModel}` 
          : clientName,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(new Date(startDate.getTime() + 60 * 60 * 1000)),
        clientName,
        carModel: carModel || '',
        licensePlate: licensePlate || '',
        phone: phone || '',
        cpf: cpf || '',
        services: services.filter(service => service.name.trim() !== ''),
        observations: observations || '',
        createdBy: appointmentData.createdBy,
        status: 'confirmed',
        createdAt: Timestamp.now()
      };

      // Salva o evento confirmado
      await setDoc(doc(db, 'events', id), eventData);

      // Remove o agendamento pendente
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
            Data/Hora: {appointmentData.date instanceof Date 
              ? appointmentData.date.toLocaleString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) 
              : 'Data inválida'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-sm font-medium mb-1">Nome do Cliente*</span>
            <Input 
              id="clientName" 
              name="clientName" 
              className="w-full" 
              required 
              maxLength={100}
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Modelo do Carro*</span>
            <Input 
              id="carModel" 
              name="carModel" 
              className="w-full" 
              required
              maxLength={50}
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Placa*</span>
            <Input 
              id="licensePlate" 
              name="licensePlate" 
              className="w-full" 
              required
              maxLength={10}
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">Telefone</span>
            <Input 
              id="phone" 
              name="phone" 
              className="w-full"
              maxLength={20}
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">CPF</span>
            <Input 
              id="cpf" 
              name="cpf" 
              className="w-full"
              maxLength={14}
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
            <span className="block text-sm font-medium mb-1">Observações</span>
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
              {isLoading ? "Salvando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}