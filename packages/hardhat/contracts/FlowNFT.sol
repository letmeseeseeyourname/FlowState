// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title FlowNFT
 * @dev Dynamic NFT that evolves based on on-chain social interactions
 * Each address can only mint one NFT (soulbound-like behavior)
 */
contract FlowNFT is ERC721, Ownable {
    using Strings for uint256;

    // State levels
    uint256 public constant IDLE = 0;
    uint256 public constant ACTIVE = 1;
    uint256 public constant BURNING = 2;

    // Thresholds for state calculation (total interactions in 2 epochs)
    uint256 public constant ACTIVE_THRESHOLD = 5;
    uint256 public constant BURNING_THRESHOLD = 20;

    // Token counter
    uint256 private _tokenIdCounter;

    // Mapping from address to token ID (one NFT per address)
    mapping(address => uint256) public tokenOfOwner;

    // Mapping to check if address has minted
    mapping(address => bool) public hasMinted;

    // External contract addresses
    address public activityTracker;
    address public tipModule;

    // Epoch stats storage
    struct EpochStats {
        uint64 likesReceived;
        uint64 likesSent;
        uint64 tipsReceived;
        uint64 tipsSent;
    }

    // user => epoch => stats
    mapping(address => mapping(uint256 => EpochStats)) public epochStats;

    // Events
    event NFTMinted(address indexed owner, uint256 indexed tokenId);
    event StateChanged(address indexed user, uint256 oldLevel, uint256 newLevel);
    event ActivityTrackerSet(address indexed tracker);
    event TipModuleSet(address indexed tipModule);

    constructor() ERC721("FlowNFT", "FLOW") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }

    /**
     * @dev Mint a FlowNFT. Each address can only mint once.
     */
    function mint() external {
        require(!hasMinted[msg.sender], "Already minted");

        uint256 tokenId = _tokenIdCounter++;
        hasMinted[msg.sender] = true;
        tokenOfOwner[msg.sender] = tokenId;

        _safeMint(msg.sender, tokenId);

        emit NFTMinted(msg.sender, tokenId);
    }

    /**
     * @dev Set the ActivityTracker contract address
     */
    function setActivityTracker(address _tracker) external onlyOwner {
        activityTracker = _tracker;
        emit ActivityTrackerSet(_tracker);
    }

    /**
     * @dev Set the TipModule contract address
     */
    function setTipModule(address _tipModule) external onlyOwner {
        tipModule = _tipModule;
        emit TipModuleSet(_tipModule);
    }

    /**
     * @dev Get current epoch (1-minute windows)
     */
    function getCurrentEpoch() public view returns (uint256) {
        return block.timestamp / 60;
    }

    /**
     * @dev Record a like action
     */
    function recordLike(address from, address to) external {
        require(msg.sender == activityTracker, "Only ActivityTracker");

        uint256 epoch = getCurrentEpoch();
        uint256 oldLevelFrom = getStateLevel(from);
        uint256 oldLevelTo = getStateLevel(to);

        epochStats[from][epoch].likesSent++;
        epochStats[to][epoch].likesReceived++;

        _checkAndEmitStateChange(from, oldLevelFrom);
        _checkAndEmitStateChange(to, oldLevelTo);
    }

    /**
     * @dev Record a tip action
     */
    function recordTip(address from, address to) external {
        require(msg.sender == tipModule, "Only TipModule");

        uint256 epoch = getCurrentEpoch();
        uint256 oldLevelFrom = getStateLevel(from);
        uint256 oldLevelTo = getStateLevel(to);

        epochStats[from][epoch].tipsSent++;
        epochStats[to][epoch].tipsReceived++;

        _checkAndEmitStateChange(from, oldLevelFrom);
        _checkAndEmitStateChange(to, oldLevelTo);
    }

    /**
     * @dev Check if state changed and emit event
     */
    function _checkAndEmitStateChange(address user, uint256 oldLevel) internal {
        uint256 newLevel = getStateLevel(user);
        if (newLevel != oldLevel) {
            emit StateChanged(user, oldLevel, newLevel);
        }
    }

    /**
     * @dev Get total interactions for a user in current + previous epoch
     */
    function getTotalInteractions(address user) public view returns (uint256) {
        uint256 currentEpoch = getCurrentEpoch();

        EpochStats memory current = epochStats[user][currentEpoch];
        EpochStats memory previous = epochStats[user][currentEpoch - 1];

        uint256 currentTotal = uint256(current.likesReceived) +
                               uint256(current.likesSent) +
                               uint256(current.tipsReceived) +
                               uint256(current.tipsSent);

        uint256 previousTotal = uint256(previous.likesReceived) +
                                uint256(previous.likesSent) +
                                uint256(previous.tipsReceived) +
                                uint256(previous.tipsSent);

        return currentTotal + previousTotal;
    }

    /**
     * @dev Get state level for a user (0=Idle, 1=Active, 2=Burning)
     */
    function getStateLevel(address user) public view returns (uint256) {
        uint256 total = getTotalInteractions(user);

        if (total >= BURNING_THRESHOLD) return BURNING;
        if (total >= ACTIVE_THRESHOLD) return ACTIVE;
        return IDLE;
    }

    /**
     * @dev Get full flow state for a user
     */
    function getFlowState(address user) external view returns (
        uint256 currentEpoch,
        uint256 likesReceived,
        uint256 likesSent,
        uint256 tipsReceived,
        uint256 tipsSent,
        uint256 totalInteractions,
        uint256 stateLevel
    ) {
        currentEpoch = getCurrentEpoch();

        EpochStats memory current = epochStats[user][currentEpoch];
        EpochStats memory previous = epochStats[user][currentEpoch - 1];

        likesReceived = uint256(current.likesReceived) + uint256(previous.likesReceived);
        likesSent = uint256(current.likesSent) + uint256(previous.likesSent);
        tipsReceived = uint256(current.tipsReceived) + uint256(previous.tipsReceived);
        tipsSent = uint256(current.tipsSent) + uint256(previous.tipsSent);
        totalInteractions = likesReceived + likesSent + tipsReceived + tipsSent;
        stateLevel = getStateLevel(user);
    }

    /**
     * @dev Get state name string
     */
    function getStateName(uint256 level) public pure returns (string memory) {
        if (level == BURNING) return "Burning";
        if (level == ACTIVE) return "Active";
        return "Idle";
    }

    /**
     * @dev Get color for state level
     */
    function getStateColor(uint256 level) public pure returns (string memory) {
        if (level == BURNING) return "#FF6B35";
        if (level == ACTIVE) return "#4ECDC4";
        return "#95A5A6";
    }

    /**
     * @dev Generate on-chain SVG based on state
     */
    function generateSVG(address user) public view returns (string memory) {
        uint256 level = getStateLevel(user);
        string memory color = getStateColor(level);
        string memory stateName = getStateName(level);
        uint256 total = getTotalInteractions(user);

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs>',
            '<radialGradient id="glow" cx="50%" cy="50%" r="50%">',
            '<stop offset="0%" style="stop-color:', color, ';stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:', color, ';stop-opacity:0.3" />',
            '</radialGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="#1a1a2e"/>',
            '<circle cx="200" cy="180" r="80" fill="url(#glow)">',
            level == BURNING ? '<animate attributeName="r" values="80;90;80" dur="0.5s" repeatCount="indefinite"/>' : '',
            '</circle>',
            '<text x="200" y="300" text-anchor="middle" fill="white" font-size="24" font-family="Arial">', stateName, '</text>',
            '<text x="200" y="340" text-anchor="middle" fill="', color, '" font-size="18" font-family="Arial">', total.toString(), ' interactions</text>',
            '</svg>'
        ));
    }

    /**
     * @dev Generate token URI with dynamic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address owner = ownerOf(tokenId);
        uint256 level = getStateLevel(owner);
        string memory stateName = getStateName(level);
        uint256 total = getTotalInteractions(owner);

        string memory svg = generateSVG(owner);
        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(abi.encodePacked(
            '{"name": "FlowNFT #', tokenId.toString(), '",',
            '"description": "A dynamic NFT that evolves based on your on-chain social activity on Monad.",',
            '"attributes": [',
            '{"trait_type": "State", "value": "', stateName, '"},',
            '{"trait_type": "Total Interactions", "value": ', total.toString(), '},',
            '{"trait_type": "State Level", "value": ', level.toString(), '}',
            '],',
            '"image": "data:image/svg+xml;base64,', svgBase64, '"}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @dev Override transfer to make NFT soulbound (reset state on transfer)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            // Transfer between addresses - update mappings
            delete tokenOfOwner[from];
            tokenOfOwner[to] = tokenId;
            hasMinted[from] = false;
            hasMinted[to] = true;
            // Note: epoch stats stay with the NFT (follow the token ID)
        }

        return super._update(to, tokenId, auth);
    }
}
