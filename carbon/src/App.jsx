import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contracts/CarbonCredit";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [energyWh, setEnergyWh] = useState(0);
  const [credits, setCredits] = useState(0);

  // Connect Wallet
  async function connectWallet() {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Load contract
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(c);
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      alert("MetaMask not detected. Please install it.");
    }
  }

  // Fetch site data (example siteId = 1)
  async function fetchCredits() {
    if (!contract) return;
    try {
      const [energy, updated] = await contract.getSiteCredits(1);
      const energyNum = Number(energy);
      setEnergyWh(energyNum);

      const creditsBn = await contract.calculateCarbonCredits(energyNum);
      setCredits(Number(creditsBn));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  useEffect(() => {
    if (contract) fetchCredits();
  }, [contract]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">🌞 Solar Carbon Credits dApp</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="p-6 bg-white shadow-md rounded-lg text-center">
          <p className="text-lg font-semibold">Connected Wallet:</p>
          <p className="text-gray-700 mb-4">{account}</p>

          <p className="font-semibold">Energy Generated: {energyWh} Wh</p>
          <p className="font-semibold">Carbon Credits: {credits}</p>

          <button
            onClick={fetchCredits}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
