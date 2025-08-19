import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contracts/CarbonCredit.js";

export function useContract() {
  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function loadContract() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(c);
      }
    }
    loadContract();
  }, []);

  return contract;
}
