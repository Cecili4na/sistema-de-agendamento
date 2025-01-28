// app/routes/agendamento-confirmado.tsx
export default function AgendamentoConfirmado() {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-4">
            <img 
              src="/laps-logo.png" 
              alt="LAPS" 
              className="h-12 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-green-600 mb-4">
            Agendamento Confirmado!
          </h1>
          <p className="text-gray-600">
            Seu agendamento foi realizado com sucesso. Em breve entraremos em contato para confirmar os detalhes.
          </p>
        </div>
      </div>
    );
  }