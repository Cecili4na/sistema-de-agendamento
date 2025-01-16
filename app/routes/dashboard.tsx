// app/routes/dashboard.tsx
import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { 
  DateSelectArg, 
  EventClickArg, 
  EventDropArg 
} from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { 
  addDoc, 
  collection, 
  onSnapshot, 
  query, 
  getDoc, 
  doc, 
  Timestamp, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { json } from "@remix-run/node";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";

// TypeScript interfaces for type safety
interface EventFormData {
  title: string;
  clientName?: string | null;
  carModel?: string | null;
  licensePlate?: string | null;
  serviceType?: string | null;
  observations?: string | null;
  start: Timestamp;
  end: Timestamp;
  createdBy: {
    uid: string;
    name: string;
  };
}

interface CalendarEvent extends Omit<EventFormData, 'start' | 'end'> {
  id: string;
  start: Date;
  end: Date;
}

interface UserData {
  name: string;
  uid: string;
}

// Loader function for Remix route
export async function loader() {
  return json({});
}
export default function Dashboard() {
    // State hooks
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const calendarRef = useRef<FullCalendar | null>(null);
  
    // Authentication effect
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (!user) {
          window.location.href = "/";
          return;
        }
  
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData({
              uid: user.uid,
              name: userDoc.data().name
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      });
  
      return () => unsubscribe();
    }, []);
  
    // Events synchronization effect
    useEffect(() => {
      const q = query(collection(db, "events"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const eventsData = querySnapshot.docs.map(doc => {
          const data = doc.data() as EventFormData;
          return {
            id: doc.id,
            ...data,
            start: data.start.toDate(),
            end: data.end.toDate(),
          };
        }) as CalendarEvent[];
        setEvents(eventsData);
      });
  
      return () => unsubscribe();
    }, []);
  
    // Handle date selection in calendar
    const handleDateSelect = (selectInfo: DateSelectArg) => {
      if (selectInfo.view.type === 'dayGridMonth') {
        if (calendarRef.current) {
          calendarRef.current.getApi().changeView('timeGridDay', selectInfo.start);
        }
        return;
      }
  
      setSelectedDate(selectInfo.start);
      setIsModalOpen(true);
    };
  
    // Handle event click
    const handleEventClick = (info: EventClickArg) => {
      const event = events.find(event => event.id === info.event.id);
      setSelectedEvent(event || null);
      setIsViewModalOpen(true);
    };
    // Submit new event
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userData || !selectedDate) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const eventData: EventFormData = {
        title: (formData.get("title") as string) || "Sem título",
        clientName: (formData.get("clientName") as string) || null,
        carModel: (formData.get("carModel") as string) || null,
        licensePlate: (formData.get("licensePlate") as string) || null,
        serviceType: (formData.get("serviceType") as string) || null,
        observations: (formData.get("observations") as string) || null,
        start: Timestamp.fromDate(selectedDate),
        end: Timestamp.fromDate(new Date(selectedDate.getTime() + 60 * 60 * 1000)),
        createdBy: {
          uid: userData.uid,
          name: userData.name
        }
      };

      await addDoc(collection(db, "events"), eventData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle event drag and drop
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const event = events.find(e => e.id === dropInfo.event.id);
      if (!event) return;

      const newStart = dropInfo.event.start;
      const newEnd = dropInfo.event.end;

      if (!newStart) {
        dropInfo.revert();
        return;
      }

      await updateDoc(doc(db, "events", event.id), {
        start: Timestamp.fromDate(newStart),
        end: Timestamp.fromDate(newEnd || new Date(newStart.getTime() + 60 * 60 * 1000))
      });
    } catch (error) {
      console.error("Erro ao mover evento:", error);
      dropInfo.revert();
    }
  };

  // Delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await deleteDoc(doc(db, "events", selectedEvent.id));
      setIsViewModalOpen(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
    }
  };

  // Logout handler
  const handleLogout = () => {
    auth.signOut();
  };
  // Render the dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  className="h-8 w-auto" 
                  src="/laps-logo.png" 
                  alt="LAPS" 
                />
                <h1 className="ml-3 text-xl font-semibold text-[#0047BB]">
                  Agenda LAPS
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userData && (
                <span className="text-sm text-gray-600">
                  Olá, {userData.name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Calendar Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
              }}
              locale={ptBrLocale}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={false}
              select={handleDateSelect}
              eventClick={handleEventClick}
              events={events}
              editable={true}
              eventColor="#0047BB"
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="18:00:00"
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              allDaySlot={false}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '06:00',
                endTime: '18:00',
              }}
              eventContent={(eventInfo) => (
                <div 
                  className="cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis" 
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {eventInfo.event.title}
                </div>
              )}
              eventDrop={handleEventDrop}
            />
          </div>
        </div>
      </main>

      {/* New Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Agendar Serviço</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título do Agendamento
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Revisão Geral"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clientName" className="text-sm font-medium">
                Nome do Cliente
              </label>
              <Input
                id="clientName"
                name="clientName"
                placeholder="Nome completo do cliente"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="carModel" className="text-sm font-medium">
                  Modelo do Carro
                </label>
                <Input
                  id="carModel"
                  name="carModel"
                  placeholder="Ex: Gol G6"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="licensePlate" className="text-sm font-medium">
                  Placa
                </label>
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="serviceType" className="text-sm font-medium">
                Tipo de Serviço
              </label>
              <Input
                id="serviceType"
                name="serviceType"
                placeholder="Ex: Revisão, Troca de Óleo, etc"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="observations" className="text-sm font-medium">
                Observações
              </label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Observações adicionais sobre o serviço"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-white">
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
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="mr-auto"
            >
              Deletar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent} 
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}