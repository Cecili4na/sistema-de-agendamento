import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "@remix-run/react";
import { auth, db, storage } from "~/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

export default function Perfil() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    // Pre-fill existing data if available
    setName(user.displayName || "");
    setPhotoPreview(user.photoURL || null);
  }, [navigate]);

  // Função de compressão de imagem
  async function compressImage(file: File): Promise<File> {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Redimensionar mantendo a proporção
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    canvas.width = width;
    canvas.height = height;
    
    ctx?.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha na compressão'));
          return;
        }
        
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        resolve(compressedFile);
      }, file.type, 0.7); // Qualidade de compressão
    });
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validações de arquivo
      if (file.size > 5 * 1024 * 1024) { // Limite de 5MB
        alert("A foto deve ter no máximo 5MB");
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        alert("Apenas imagens JPEG, PNG ou GIF são permitidas");
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validação de nome
    if (!name.trim()) {
      setError("Nome é obrigatório");
      setIsLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      let photoURL = user.photoURL;

      // Upload de foto
      if (photoFile) {
        try {
          // Renomear arquivo para evitar conflitos
          const fileExtension = photoFile.name.split('.').pop();
          const fileName = `profile_${user.uid}.${fileExtension}`;
          
          const photoRef = ref(storage, `users/${user.uid}/${fileName}`);
          
          // Compressão de imagem antes do upload
          const compressedFile = await compressImage(photoFile);
          
          const metadata = {
            contentType: compressedFile.type,
            customMetadata: {
              'user': user.uid
            }
          };

          const snapshot = await uploadBytes(photoRef, compressedFile, metadata);
          photoURL = await getDownloadURL(snapshot.ref);
        } catch (uploadError) {
          console.error("Erro no upload da foto:", uploadError);
          setError("Erro ao enviar foto. Verifique sua conexão.");
          setIsLoading(false);
          return;
        }
      }

      // Atualizar perfil de autenticação
      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL || undefined
      });

      // Atualizar documento no Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name,
        phone: phone.trim() || null,
        address: address.trim() || null,
        ...(photoURL && { photoURL })
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Completar Perfil</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Foto de perfil" 
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                  Sem foto
                </div>
              )}
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/jpeg,image/png,image/gif"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <label 
                htmlFor="photo" 
                className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                ✏️
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefone (Opcional)
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Endereço (Opcional)
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Rua, número, bairro, cidade - UF"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-[#0047BB] text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}