import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Dashboard from "./components/Dashboard";
import NFTGallery from "./components/NFTGallery";
import { useContract } from "./hooks/useContract";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contracts/CarbonCredit.js";

// import ConnectWallet from "./components/ConnectWallet";
// import Dashboard from "./components/Dashboard";
// import NFTGallery from "./components/NFTGallery";
// import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contracts/CarbonCredit.js";

function App() {
  const [account, setAccount] = useState(null);
  const [energyWh, setEnergyWh] = useState(0);
  const [credits, setCredits] = useState(0);
  const [nfts, setNfts] = useState([]);
  const contract = useContract();

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    }
  }

  function disconnectWallet() {
    setAccount(null);
    setEnergyWh(0);
    setCredits(0);
    setNfts([]);
  }

  async function fetchCredits() {
    if (!contract) return;
    const [energy] = await contract.getSiteCredits(1);
    setEnergyWh(Number(energy));
    const creditsBn = await contract.calculateCarbonCredits(Number(energy));
    setCredits(Number(creditsBn));
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">🌍 Solar Carbon Credits dApp</h1>
      
      <ConnectWallet account={account} connectWallet={connectWallet} disconnectWallet={disconnectWallet} />

      {account && (
        <>
          <Dashboard energyWh={energyWh} credits={credits} fetchCredits={fetchCredits} />
          <NFTGallery nfts={nfts} />
        </>
      )}
    </div>
  );
}

export default App;
