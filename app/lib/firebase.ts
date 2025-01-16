// app/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCH-7XtYkiLZlVYfl0v3cqNrqy5fBn9Bko",
  authDomain: "agedalaps.firebaseapp.com",
  projectId: "agedalaps",
  storageBucket: "agedalaps.appspot.com",
  messagingSenderId: "573268365214",
  appId: "1:573268365214:web:3f00dff9d64a4ce5f4108f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

