// app/routes/_index.tsx
import { useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/lib/firebase";

export default function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Email ou senha incorretos");
    } finally {
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
                {isLoading ? "Entrando..." : "Entrar"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link to="/registro" className="text-[#0047BB] hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}