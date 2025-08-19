import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./hooks/useContract";   // ✅ only one import

import { ToastContainer, toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [account, setAccount] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [energyWh, setEnergyWh] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [credits, setCredits] = useState(null);
  const [minting, setMinting] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // 🔹 Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (err) {
      toast.error("Wallet connection failed");
      console.error(err);
    }
  };

  // 🔹 Disconnect Wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSiteId("");
    setEnergyWh(null);
    setLastUpdated(null);
    setCredits(null);
    setTxHash(null);
    toast.info("Wallet disconnected");
  };

  // 🔹 Load Site Credits
  const loadSiteCredits = async () => {
    if (!window.ethereum) return toast.error("Please install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);

    try {
      setLoadingCredits(true);
      const [energy, updated] = await contract.getSiteCredits(siteId);
      setEnergyWh(energy.toString());
      setLastUpdated(new Date(updated * 1000).toLocaleString());
      toast.success("Credits loaded successfully!");
    } catch (err) {
      toast.error("Error fetching credits");
      console.error(err);
    } finally {
      setLoadingCredits(false);
    }
  };

  // 🔹 Calculate Credits
  const calculateCredits = async () => {
    if (!window.ethereum) return toast.error("Please install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);

    try {
      setCalculating(true);
      const result = await contract.calculateCarbonCredits(energyWh);
      setCredits(result.toString());
      toast.success("Carbon credits calculated!");
    } catch (err) {
      toast.error("Error calculating credits");
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  // 🔹 Mint NFT
  const mintNFT = async () => {
    if (!window.ethereum) return toast.error("Please install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    try {
      setMinting(true);
      const metadataURI = "https://your-metadata.example/"; // <-- replace later
      const tx = await contract.mintCreditNFT(metadataURI, credits, {
        value: ethers.parseEther("0.01"),
      });
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      toast.success("🎉 NFT Minted Successfully!");
    } catch (err) {
      toast.error("Mint failed");
      console.error(err);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-6">🌱 Solar Carbon DApp</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm">Connected: {account}</p>
            <button
              onClick={disconnectWallet}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Disconnect
            </button>
          </div>

          {/* Site Input */}
          <input
            type="text"
            placeholder="Enter Site ID"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />
          <button
            onClick={loadSiteCredits}
            disabled={loadingCredits}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full flex items-center justify-center"
          >
            {loadingCredits ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Loading...
              </>
            ) : (
              "Load Site Credits"
            )}
          </button>

          {energyWh && (
            <div className="mt-4">
              <p><strong>Energy (Wh):</strong> {energyWh}</p>
              <p><strong>Last Updated:</strong> {lastUpdated}</p>
              <button
                onClick={calculateCredits}
                disabled={calculating}
                className="bg-green-500 text-white px-4 py-2 rounded mt-2 w-full flex items-center justify-center"
              >
                {calculating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Calculating...
                  </>
                ) : (
                  "Calculate Credits"
                )}
              </button>
            </div>
          )}

          {credits && (
            <div className="mt-4">
              <p><strong>Carbon Credits:</strong> {credits}</p>
              <button
                onClick={mintNFT}
                disabled={minting}
                className="bg-purple-500 text-white px-4 py-2 rounded mt-2 w-full flex items-center justify-center"
              >
                {minting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Minting...
                  </>
                ) : (
                  "Mint NFT"
                )}
              </button>
            </div>
          )}

          {txHash && (
            <p className="mt-4 text-sm text-gray-700 break-all">
              ✅ Minted! Tx:{" "}
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {txHash}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
