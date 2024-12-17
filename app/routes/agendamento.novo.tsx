import { useState } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { auth, db } from "~/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function NovoAgendamento() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const service = formData.get("service") as string;
    
    // Optional fields
    const clientName = formData.get("clientName") as string | null;
    const carModel = formData.get("carModel") as string | null;
    const licensePlate = formData.get("licensePlate") as string | null;
    const observations = formData.get("observations") as string | null;

    try {
      await addDoc(collection(db, "appointments"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userPhotoURL: auth.currentUser.photoURL,
        date: Timestamp.fromDate(new Date(date!)),
        timeSlot: time,
        service,
        status: 'scheduled',
        createdAt: Timestamp.now(),
        // Optional fields added with null check
        ...(clientName && { clientName }),
        ...(carModel && { carModel }),
        ...(licensePlate && { licensePlate }),
        ...(observations && { observations })
      });

      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Agendamento</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
              Data e Hora
            </label>
            <p id="datetime" className="mt-1 text-gray-600">
              {new Date(date!).toLocaleDateString()} às {time}
            </p>
          </div>

          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700">
              Serviço
            </label>
            <select
              id="service"
              name="service"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Selecione um serviço</option>
              <option value="revisao">Revisão</option>
              <option value="manutencao">Manutenção</option>
              <option value="reparo">Reparo</option>
            </select>
          </div>

          {/* Optional Fields */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
              Nome do Cliente (Opcional)
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="carModel" className="block text-sm font-medium text-gray-700">
              Modelo do Carro (Opcional)
            </label>
            <input
              type="text"
              id="carModel"
              name="carModel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
              Placa do Veículo (Opcional)
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
              Observações (Opcional)
            </label>
            <textarea
              id="observations"
              name="observations"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-[#0047BB] text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Agendando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}