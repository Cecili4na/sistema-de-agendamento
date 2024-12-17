import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string; // Make photo optional
  phone?: string; // Optional phone number
  address?: string; // Optional address
  createdAt: Timestamp;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string; // Make user photo optional
  date: Timestamp;
  timeSlot: string;
  service: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  
  // Optional fields for appointments
  clientName?: string;
  carModel?: string;
  licensePlate?: string;
  observations?: string;
}