import { useState, useEffect } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Appointment } from "~/types";
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { User } from "lucide-react";

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      // Ajuste para pegar a data corretamente
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      try {
        // Consulta ajustada
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

        console.log('Agendamentos carregados:', loadedAppointments); // Debug
        setAppointments(loadedAppointments);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate, navigate, user]);

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

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
              <Link to="/perfil" className="flex items-center space-x-2">
                <img 
                  src={user.photoURL} 
                  alt="Perfil" 
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
          {/* Calendário */}
          <div className="bg-white p-4 rounded-lg shadow">
            <Calendar
              onChange={(date) => date instanceof Date && setSelectedDate(date)}
              value={selectedDate}
              className="w-full"
            />
          </div>

          {/* Horários */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Horários para {selectedDate.toLocaleDateString()}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => {
                  const isBooked = appointments.some(apt => apt.timeSlot === time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        if (!isBooked) {
                          navigate(`/agendamento/novo?date=${selectedDate.toISOString()}&time=${time}`);
                        }
                      }}
                      disabled={isBooked}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        isBooked 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-50 text-[#0047BB] hover:bg-blue-100'
                      }`}
                    >
                      {time}
                      {isBooked && " (Ocupado)"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}