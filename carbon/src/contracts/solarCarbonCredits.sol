// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin contracts for security and token standards
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Chainlink Functions contracts
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title ManualSolarCreditNFT
 * @author Gemini
 * @notice A professional, robust, and manually triggered multi-user carbon credit NFT system.
 * Perfect for project demonstrations. Users register their solar assets, and then any user
 * can call the requestAndMint function to trigger the Chainlink Functions data fetch and minting process.
 */
contract ManualSolarCreditNFT is ERC721, Ownable, FunctionsClient, Pausable, ReentrancyGuard {
    using Strings for uint256;
    using FunctionsRequest for FunctionsRequest.Request;

    // --- State Variables ---

    struct SolarAsset {
        uint256 panelArea;      // in square meters
        uint256 efficiency;     // e.g., 17 for 17%
        bool isRegistered;
    }

    mapping(address => SolarAsset) public solarAssets;
    
    // Chainlink Functions configuration
    address private immutable s_router;
    bytes32 private immutable s_donId;
    uint64 private s_subscriptionId;
    uint32 private immutable s_gasLimit;
    string private s_source;
    uint256 private s_gridEmissionFactor; // Updatable by owner

    mapping(bytes32 => address) public s_requestInitiator;
    mapping(uint256 => uint256) public carbonCreditValue;
    mapping(uint256 => uint256) public issuanceTimestamp;
    uint256 private s_tokenIdCounter;
    
    // --- Events ---
    event AssetRegistered(address indexed user, uint256 panelArea, uint256 efficiency);
    event RequestSent(bytes32 indexed requestId, address indexed user);
    event RequestFulfilled(bytes32 indexed requestId, uint256 creditValue);
    event CreditNFTMinted(address indexed owner, uint256 indexed tokenId, uint256 creditValueGrams, uint256 timestamp);
    event GridFactorUpdated(uint256 newGridFactor);

    // --- Constructor ---
    constructor(uint64 subscriptionId) ERC721("Verifiable Solar Credit", "VSC") FunctionsClient(0xb83E47C2bC239B3bf370bc41e1459A34b41238D0) Ownable(msg.sender) {
        s_router = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0; // Sepolia Router
        s_donId = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000; // Sepolia DON ID
        s_gasLimit = 300000;
        s_subscriptionId = subscriptionId;
        s_gridEmissionFactor = 708; // Initial value (gCO2e per kWh)

        s_source = "const panelArea=args[0];const efficiency=args[1];const gridFactor=args[2];const API_URL='https://api.open-meteo.com/v1/forecast?latitude=19.9975&longitude=73.7898&daily=shortwave_radiation_sum&timezone=auto';const apiRequest=Functions.makeHttpRequest({url:API_URL});const[apiResponse]=await Promise.all([apiRequest]);if(apiResponse.error){throw new Error('API request failed');}const radiationData=apiResponse.data.daily.shortwave_radiation_sum[0];const energyGeneratedWh=(radiationData*parseFloat(panelArea)*(parseFloat(efficiency)/100));const creditsInGrams=(energyGeneratedWh*parseFloat(gridFactor))/1000;return Functions.encodeUint256(Math.round(creditsInGrams));";
    }

    // --- User Functions ---
    function registerSolarAsset(uint256 panelArea, uint256 efficiency) external whenNotPaused {
        require(panelArea > 0 && efficiency > 0 && efficiency <= 100, "Invalid parameters");
        require(!solarAssets[msg.sender].isRegistered, "Asset already registered");

        solarAssets[msg.sender] = SolarAsset(panelArea, efficiency, true);
        emit AssetRegistered(msg.sender, panelArea, efficiency);
    }

    function requestAndMint() external whenNotPaused returns (bytes32 requestId) {
        SolarAsset storage asset = solarAssets[msg.sender];
        require(asset.isRegistered, "User must register asset first");
        
        string[] memory args = new string[](3);
        args[0] = asset.panelArea.toString();
        args[1] = asset.efficiency.toString();
        args[2] = s_gridEmissionFactor.toString();

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_source);
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), s_subscriptionId, s_gasLimit, s_donId);

        s_requestInitiator[requestId] = msg.sender;
        emit RequestSent(requestId, msg.sender);
        return requestId;
    }

    // --- Oracle Callback ---
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override nonReentrant {
        if (err.length > 0) {
            revert("Chainlink Functions request failed");
        }

        uint256 creditsInGrams = abi.decode(response, (uint256));
        emit RequestFulfilled(requestId, creditsInGrams);

        address user = s_requestInitiator[requestId];
        uint256 newTokenId = s_tokenIdCounter;
        carbonCreditValue[newTokenId] = creditsInGrams;
        issuanceTimestamp[newTokenId] = block.timestamp;

        _safeMint(user, newTokenId);
        s_tokenIdCounter++;
        emit CreditNFTMinted(user, newTokenId, creditsInGrams, block.timestamp);
    }

    // --- Owner Functions ---
    function setSubscriptionId(uint64 newSubscriptionId) external onlyOwner {
        s_subscriptionId = newSubscriptionId;
    }

    function setGridEmissionFactor(uint256 newGridFactor) external onlyOwner {
        s_gridEmissionFactor = newGridFactor;
        emit GridFactorUpdated(newGridFactor);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- NFT Metadata Generation ---
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        ownerOf(_tokenId);
        uint256 creditValue = carbonCreditValue[_tokenId];
        uint256 timestamp = issuanceTimestamp[_tokenId];
        string memory svgImage = generateProfessionalSVG(_tokenId, creditValue, timestamp);
        string memory encodedSvg = Base64.encode(bytes(svgImage));

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Verifiable Solar Credit #', _tokenId.toString(), '", ',
                    '"description": "A verifiable, on-chain solar energy carbon credit generated in Nashik, India.", ',
                    '"attributes": [',
                        '{"trait_type": "Carbon Credits (grams CO2e)", "value": ', creditValue.toString(), '},',
                        '{"trait_type": "Vintage Year", "value": "2025"},',
                        '{"trait_type": "Methodology", "value": "Verified Solar Displacement"},',
                        '{"display_type": "date", "trait_type": "Issuance Date", "value": ', timestamp.toString(), '}',
                    ']',
                    ',"image": "data:image/svg+xml;base64,', encodedSvg, '"}'
                )
            )
        );
        
        return string.concat("data:application/json;base64,", json);
    }

    function generateProfessionalSVG(uint256 tokenId, uint256 amount, uint256 timestamp) internal pure returns (string memory) {
        return string.concat(
            '<svg width="350" height="500" xmlns="http://www.w3.org/2000/svg">',
                '<style>.base{font-family:sans-serif;fill:white;} .heavy{font-weight:bold;} .light{fill-opacity:0.8;}</style>',
                '<rect width="100%" height="100%" rx="15" fill="#0D1117"/>',
                '<rect width="340" height="490" x="5" y="5" rx="10" fill="none" stroke="#10B981" stroke-width="2"/>',
                // Header
                '<path d="M175 30 L190 50 L175 70 L160 50 Z" fill="#10B981"/>',
                '<text x="175" y="95" class="base heavy" font-size="18" text-anchor="middle">VERIFIABLE CARBON CREDIT</text>',
                // Main Value
                '<text x="175" y="160" class="base heavy" font-size="60" text-anchor="middle">', amount.toString(), '</text>',
                '<text x="175" y="185" class="base" font-size="16" text-anchor="middle">grams of CO2 Equivalent</text>',
                // Divider
                '<line x1="40" y1="220" x2="310" y2="220" stroke="white" stroke-opacity="0.3"/>',
                // Data Fields
                '<text x="40" y="260" class="base light" font-size="14">Vintage Year</text>',
                '<text x="310" y="260" class="base heavy" font-size="14" text-anchor="end">2025</text>',
                '<text x="40" y="290" class="base light" font-size="14">Project Location</text>',
                '<text x="310" y="290" class="base heavy" font-size="14" text-anchor="end">Nashik, India</text>',
                '<text x="40" y="320" class="base light" font-size="14">Methodology</text>',
                '<text x="310" y="320" class="base heavy" font-size="14" text-anchor="end">Verified Solar Displacement</text>',
                '<text x="40" y="350" class="base light" font-size="14">Issuance Date (UTC)</text>',
                '<text x="310" y="350" class="base heavy" font-size="14" text-anchor="end">', timestamp.toString(), '</text>',
                // Footer & Serial
                '<line x1="40" y1="400" x2="310" y2="400" stroke="white" stroke-opacity="0.3"/>',
                '<text x="175" y="430" class="base light" font-size="12" text-anchor="middle">Serial Number</text>',
                '<text x="175" y="460" class="base heavy" font-size="16" text-anchor="middle" letter-spacing="1">VSC-00000000-', tokenId.toString(), '</text>',
            '</svg>'
        );
    }
}
