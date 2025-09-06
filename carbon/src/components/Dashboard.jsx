export default function Dashboard({ energyWh, credits, fetchCredits }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🌞 Dashboard</h2>

      <div className="space-y-2">
        <p className="text-lg font-semibold">Energy Generated: <span className="text-green-600">{energyWh} Wh</span></p>
        <p className="text-lg font-semibold">Carbon Credits:<span className="text-blue-600">{credits}</span></p>
      </div>

      <button
        onClick={fetchCredits}
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        🔄 Refresh Data
      </button>
    </div>
  );
}
