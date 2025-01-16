import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import sql from "mssql";

const config = {
    user: "sitemercado",
    password: "Sfc@23144",
    server: "217638055",
    database: "sitemercado", // ajuste se o nome do banco for diferente
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

export async function loader() {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT * FROM VW_Veiculos_AcompanhamentoPainel_Orcamentos
        `;
        return json({ veiculos: result.recordset });
    } catch (error) {
        console.error('Erro:', error);
        throw new Error('Falha ao carregar dados');
    } finally {
        await sql.close();
    }
}

export default function Carros() {
    const { veiculos } = useLoaderData<typeof loader>();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Lista de Veículos</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Ajuste as colunas de acordo com sua view */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Modelo
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {veiculos.map((veiculo) => (
                            <tr key={veiculo.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {veiculo.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {veiculo.modelo}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}