// src/contracts/CarbonCredit.js
export const CONTRACT_ADDRESS = "0x00eb7C1F79f9c7B5a247beFC389C1e807a2B71dE";

export const CONTRACT_ABI = [
  "function getSiteCredits(uint256 siteId) view returns (uint256 energyWh, uint256 lastUpdated)",
  "function calculateCarbonCredits(uint256 energyWh) pure returns (uint256 credits)",
  "function mintCreditNFT(string metadataURI, uint256 credits) payable returns (uint256 tokenId)",
  "event CreditMinted(address indexed minter, uint256 tokenId, uint256 credits, string metadataURI)"
];
