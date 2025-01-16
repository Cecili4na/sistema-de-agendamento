// app/routes/historico.tsx
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import sql from "mssql";

const config = {
  user: "seu_usuario",
  password: "sua_senha",
  server: "SERVSOFT\\SQLEXPRESS",
  database: "BaseLucianoAuto_New",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const placa = url.searchParams.get("placa");

  if (!placa) {
    return json({ veiculos: [] });
  }

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT 
        Data, 
        Placa, 
        KM, 
        Servicos, 
        DescricaoServicos, 
        Cliente, 
        NomeCliente
      FROM VW_Veiculos_AcompanhamentoPainel_Orcamentos
      WHERE Placa = ${placa}
      ORDER BY Data DESC
    `;
    return json({ veiculos: result.recordset });
  } catch (error) {
    console.error('Erro:', error);
    throw new Error('Falha ao carregar dados');
  } finally {
    await sql.close();
  }
}

export default function Historico() {
  const [placa, setPlaca] = useState("");
  const fetcher = useFetcher();
  const { veiculos } = useLoaderData<typeof loader>();

  const handleSearch = () => {
    if (placa.trim()) {
      fetcher.load(`/historico?placa=${placa}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="py-4 bg-gray-100 text-center font-bold text-xl">
        Histórico de Veículos
      </div>
      
      <div className="flex flex-col items-center pt-5 w-full px-4">
        <div className="mb-4 w-full max-w-md">
          <input 
            type="text"
            placeholder="Digite a placa do veículo"
            className="p-2 border rounded w-full"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            maxLength={7}
          />
          <button 
            onClick={handleSearch}
            className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Buscar
          </button>
        </div>

        {fetcher.state === "loading" ? (
          <div className="p-4">Carregando...</div>
        ) : veiculos?.length > 0 ? (
          <div className="w-full max-w-6xl bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviços/Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {veiculos.map((veiculo, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(veiculo.Data).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {veiculo.Placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {veiculo.KM?.toLocaleString()} km
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {veiculo.Servicos || veiculo.DescricaoServicos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {veiculo.Cliente || veiculo.NomeCliente}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : placa && !fetcher.state === "loading" ? (
          <div className="p-4 text-center text-gray-500">
            Nenhum registro encontrado para esta placa
          </div>
        ) : null}
      </div>
    </div>
  );
}