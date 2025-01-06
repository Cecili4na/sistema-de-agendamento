import { useState, useEffect } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Appointment } from "~/types";
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { User, X, Clock, Calendar as CalendarIcon } from "lucide-react";

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(
          appointmentsRef,
          where("date", ">=", Timestamp.fromDate(start)),
          where("date", "<=", Timestamp.fromDate(end))
        );

        const querySnapshot = await getDocs(q);
        const loadedAppointments: Appointment[] = [];
        
        querySnapshot.forEach((doc) => {
          loadedAppointments.push({
            id: doc.id,
            ...doc.data()
          } as Appointment);
        });

        setAppointments(loadedAppointments);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate, navigate, user]);

  const handleTimeSlotClick = (time: string) => {
    const appointment = appointments.find(apt => apt.timeSlot === time);
    if (appointment) {
      setSelectedAppointment(appointment);
    } else {
      navigate(`/agendamento/novo?date=${selectedDate.toISOString()}&time=${time}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/laps-logo.png" alt="LAPS" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user?.photoURL ? (
              <Link to="/profile" className="flex items-center space-x-2">
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="hidden md:inline">{user.displayName}</span>
              </Link>
            ) : (
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
              >
                <User />
                <span className="hidden md:inline">Completar Perfil</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                auth.signOut();
                navigate('/');
              }}
              className="px-4 py-2 bg-[#0047BB] text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <Calendar
              onChange={(date) => date instanceof Date && setSelectedDate(date)}
              value={selectedDate}
              className="w-full"
            />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CalendarIcon className="mr-2" />
              Horários para {selectedDate.toLocaleDateString()}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => {
                  const appointment = appointments.find(apt => apt.timeSlot === time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSlotClick(time)}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        appointment 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-blue-50 text-[#0047BB] hover:bg-blue-100'
                      }`}
                    >
                      <Clock className="inline-block mr-1" size={16} />
                      {time}
                      {appointment && (
                        <div className="mt-1 text-xs flex items-center justify-center">
                          <span className="font-bold">Ocupado</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Agendamento</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex items-center mb-4">
              <img 
                src={selectedAppointment.userPhotoURL || '/default-avatar.png'} 
                alt={selectedAppointment.userName}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <p className="font-semibold">Agendado por: {selectedAppointment.userName}</p>
              </div>
            </div>
            <p><strong>Data:</strong> {new Date(selectedAppointment.date.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Horário:</strong> {selectedAppointment.timeSlot}</p>
            <p><strong>Serviço:</strong> {selectedAppointment.service}</p>
            {selectedAppointment.clientName && <p><strong>Cliente:</strong> {selectedAppointment.clientName}</p>}
            {selectedAppointment.carModel && <p><strong>Modelo do Carro:</strong> {selectedAppointment.carModel}</p>}
            {selectedAppointment.licensePlate && <p><strong>Placa:</strong> {selectedAppointment.licensePlate}</p>}
            {selectedAppointment.observations && (
              <p><strong>Observações:</strong> {selectedAppointment.observations}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}