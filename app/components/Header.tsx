
export function Header({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/laps-logo.png" alt="LAPS" className="h-10 w-10 mr-3" />
          <h1 className="text-xl font-bold text-[#0047BB]">
            Portal LAPS
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg text-white transition-colors bg-[#0047BB] hover:bg-blue-700"
        >
          Sair
        </button>
      </div>
    </header>
  );
}