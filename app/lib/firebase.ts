// app/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
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

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiplas abas abertas, persistência pode ser habilitada em apenas uma
  } else if (err.code === 'unimplemented') {
    // O navegador atual não suporta persistência
  }
});

export { auth, db, storage };