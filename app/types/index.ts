// types.ts
import { Timestamp } from "firebase/firestore";

export interface EventFormData {
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

export interface CalendarEvent extends Omit<EventFormData, 'start' | 'end'> {
  id: string;
  start: Date;
  end: Date;
}