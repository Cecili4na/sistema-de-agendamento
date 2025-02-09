import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { json } from "@remix-run/node";
import { FaGoogle } from "react-icons/fa";

export async function loader() {
  return json({});
}

export default function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "/dashboard";
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login error:", err);
      setError("Email ou senha incorretos");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Salva ou atualiza os dados do usuário
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          createdAt: Timestamp.now()
        });
      } else {
        // Atualiza o nome se necessário
        if (userDoc.data().name !== user.displayName && user.displayName) {
          await setDoc(userDocRef, {
            ...userDoc.data(),
            name: user.displayName
          }, { merge: true });
        }
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Google Sign-In error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Por favor, permita popups para este site');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. Tente novamente');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado');
      } else {
        setError('Erro ao fazer login com Google');
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="relative max-w-md w-full">
        <div className="p-[1px] rounded-2xl bg-gradient-to-r from-[#0047BB] via-blue-400 to-[#0047BB]">
          <div className="bg-white p-8 rounded-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-[#0047BB] p-4 rounded-xl shadow-lg">
                <img src="/laps-logo.png" alt="LAPS" className="h-16 w-auto rounded-md"/>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-black">Portal LAPS</h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-xl bg-[#0047BB] text-white hover:bg-blue-700"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Ou continue com
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full mt-4 py-2 px-4 rounded-xl border border-gray-300 
                           flex items-center justify-center 
                           text-gray-700 hover:bg-gray-50
                           transition duration-300"
              >
                <FaGoogle className="mr-2" />
                {isGoogleLoading ? "Entrando..." : "Entrar com Google"}
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              Não tem uma conta?{" "}
              <Link to="/registro" className="text-[#0047BB] hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}