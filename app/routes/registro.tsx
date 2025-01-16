// app/routes/registro.tsx
import { useState } from "react";
import { Link } from "@remix-run/react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Salvar informações adicionais no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date()
      });

      // Redirecionar para o dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Erro no registro:", err);
      setError("Erro ao criar conta. Verifique os dados e tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="relative max-w-md w-full">
        <div className="p-[1px] rounded-2xl bg-gradient-to-r from-[#0047BB] via-blue-400 to-[#0047BB]">
          <div className="bg-white p-8 rounded-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-[#0047BB] p-4 rounded-lg shadow-lg">
                <img src="/laps-logo.png" alt="LAPS" className="h-16 w-auto"/>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-black">Criar Conta</h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    minLength={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg bg-[#0047BB] text-white hover:bg-blue-700"
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link to="/" className="text-[#0047BB] hover:underline">
                  Faça login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}