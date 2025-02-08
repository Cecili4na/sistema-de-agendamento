import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

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

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});