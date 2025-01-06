import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

interface Carro {
    id: number;
    modelo: string;
    marca: string;
    ano: number;
}

export async function loader() {
    try {
        const response = await fetch('http://IP-DO-SERVIDOR:3000/api/carros');
        const carros = await response.json();
        return json({ carros });
    } catch (error) {
        console.error('Erro:', error);
        throw new Error('Falha ao carregar carros');
    }
}

export default function CarrosRoute() {
    const { carros } = useLoaderData<{ carros: Carro[] }>();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Lista de Carros</h1>
            
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Modelo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Marca
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ano
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {carros.map((carro) => (
                            <tr key={carro.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carro.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carro.modelo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carro.marca}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carro.ano}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}