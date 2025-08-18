// Replace with your deployed contract address
export const CONTRACT_ADDRESS = "0xYourContractAddressHere";

// Replace with your ABI (from compilation or deployment output)
export const CONTRACT_ABI = [
  "function getSiteCredits(uint256 siteId) view returns (uint256 energyWh, uint256 lastUpdated)",
  "function calculateCarbonCredits(uint256 energyWh) pure returns (uint256 credits)",
  "function mintCreditNFT(string metadataURI, uint256 credits) payable returns (uint256 tokenId)",
  "event CreditMinted(address indexed minter, uint256 tokenId, uint256 credits, string metadataURI)"
];
