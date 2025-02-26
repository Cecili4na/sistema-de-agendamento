import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { EventDropArg } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { Button } from "../components/ui/button";
import { 
  collection, 
  onSnapshot, 
  query, 
  getDoc, 
  doc, 
  Timestamp, 
  updateDoc,
  setDoc 
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { json } from "@remix-run/node";
import { CalendarEvent } from "../types";
import EventFormModal from "../components/EventFormMotal";
import { EventDetailsModal } from "../components/EventDetailsModal";

interface UserData {
  name: string;
  uid: string;
}

export async function loader() {
  return json({});
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            name: user.displayName || user.email?.split('@')[0] || 'Usuário',
            email: user.email,
            createdAt: Timestamp.now()
          });
        }

        const fetchedUserDoc = await getDoc(userDocRef);
        if (fetchedUserDoc.exists()) {
          setUserData({
            uid: user.uid,
            name: fetchedUserDoc.data().name
          });
        }
      } catch (error) {
        console.error("Error fetching/creating user data:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
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

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(arg.date);
    setIsModalOpen(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const event = events.find(event => event.id === info.event.id);
    setSelectedEvent(event || null);
    setIsViewModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
    setIsViewModalOpen(false);
  };

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

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  className="h-8 w-auto sm:h-10" 
                  src="/laps-logo.png" 
                  alt="LAPS" 
                />
                <h1 className="ml-3 text-xl font-semibold text-[#0047BB] hidden sm:block">
                  Agenda LAPS
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userData && (
                <span className="text-sm text-gray-600 hidden sm:block">
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

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 sm:p-6">
            <div className="[&_.fc-toolbar.fc-header-toolbar]:flex [&_.fc-toolbar.fc-header-toolbar]:flex-col sm:[&_.fc-toolbar.fc-header-toolbar]:flex-row [&_.fc-toolbar.fc-header-toolbar]:gap-4 sm:[&_.fc-toolbar.fc-header-toolbar]:gap-2 [&_.fc-toolbar.fc-header-toolbar]:mb-6">
              <div className="[&_.fc-toolbar-title]:text-xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-center sm:[&_.fc-toolbar-title]:text-left">
                <div className="[&_.fc-toolbar-chunk:last-child]:flex [&_.fc-toolbar-chunk:last-child]:flex-col sm:[&_.fc-toolbar-chunk:last-child]:flex-row [&_.fc-toolbar-chunk:last-child]:gap-3 sm:[&_.fc-toolbar-chunk:last-child]:gap-2">
                  <div className="[&_.fc-button-group]:flex [&_.fc-button-group]:justify-center [&_.fc-button-group]:gap-2 [&_.fc-button]:h-10 [&_.fc-button]:min-w-[40px] [&_.fc-button]:px-3 [&_.fc-button]:py-2 [&_.fc-button]:text-sm [&_.fc-today-button]:w-full sm:[&_.fc-today-button]:w-auto">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[
                        dayGridPlugin, 
                        timeGridPlugin, 
                        interactionPlugin
                      ]}
                      initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
                      headerToolbar={{
                        left: "title",
                        center: "",
                        right: "prev,next today dayGridMonth,timeGridWeek,timeGridDay"
                      }}
                      buttonText={{
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        day: 'Dia'
                      }}
                      locale={ptBrLocale}
                      selectable={false}
                      dateClick={handleDateClick}
                      weekends={false}
                      events={events}
                      editable={true}
                      eventColor="#0047BB"
                      height="auto"
                      contentHeight="auto"
                      aspectRatio={isMobile ? 0.8 : 1.35}
                      slotMinTime="06:00:00"
                      slotMaxTime="18:00:00"
                      slotDuration="00:30:00"
                      snapDuration="00:15:00"
                      allDaySlot={false}
                      selectConstraint="businessHours"
                      eventClick={handleEventClick}
                      eventContent={(eventInfo) => {
                        const eventId = eventInfo.event.id;
                        const event = events.find(e => e.id === eventId);
                        const isCanceled = event?.status === "canceled";
                        
                        return (
                          <div 
                            className="whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1"
                            style={{
                              backgroundColor: isCanceled ? '#A52A2A' : '',
                              color: isCanceled ? 'white' : '',
                              borderColor: isCanceled ? '#E9967A' : '',
                             
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {eventInfo.event.title}
                          </div>
                        );
                      }}
                      eventDrop={handleEventDrop}
                      views={{
                        timeGridDay: {
                          type: 'timeGrid',
                          duration: { days: 1 },
                          buttonText: 'Dia'
                        },
                        timeGridWeek: {
                          type: 'timeGrid',
                          duration: { weeks: 1 },
                          buttonText: 'Semana'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        userData={userData}
      />

      <EventDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        selectedEvent={selectedEvent}
        onEdit={handleEditEvent}
      />

      <EventFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedDate={eventToEdit ? eventToEdit.start : null}
        userData={userData}
        eventToEdit={eventToEdit}
      />
    </div>
  );
}