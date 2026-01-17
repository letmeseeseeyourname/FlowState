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
     * @dev Get deterministic traits from address
     */
    function getTraits(address user) public pure returns (
        uint8 skinTone,
        uint8 eyeStyle,
        uint8 mouthStyle,
        uint8 hairStyle,
        uint8 accessory,
        uint8 bgPattern
    ) {
        bytes20 addr = bytes20(user);
        skinTone = uint8(addr[0]) % 6;
        eyeStyle = uint8(addr[1]) % 5;
        mouthStyle = uint8(addr[2]) % 4;
        hairStyle = uint8(addr[3]) % 6;
        accessory = uint8(addr[4]) % 5;
        bgPattern = uint8(addr[5]) % 4;
    }

    /**
     * @dev Get skin color from trait
     */
    function getSkinColor(uint8 tone) internal pure returns (string memory) {
        if (tone == 0) return "#FFDBB4";
        if (tone == 1) return "#EDB98A";
        if (tone == 2) return "#D08B5B";
        if (tone == 3) return "#AE5D29";
        if (tone == 4) return "#694D3D";
        return "#F5D0C5";
    }

    /**
     * @dev Get hair color from address byte
     */
    function getHairColor(address user) internal pure returns (string memory) {
        uint8 c = uint8(bytes20(user)[6]) % 6;
        if (c == 0) return "#2C1810";
        if (c == 1) return "#71635A";
        if (c == 2) return "#B7A69E";
        if (c == 3) return "#D4A574";
        if (c == 4) return "#8B4513";
        return "#1a1a2e";
    }

    /**
     * @dev Generate on-chain SVG avatar based on address and state
     */
    function generateSVG(address user) public view returns (string memory) {
        uint256 level = getStateLevel(user);
        string memory stateColor = getStateColor(level);
        string memory stateName = getStateName(level);
        uint256 total = getTotalInteractions(user);

        (uint8 skinTone, uint8 eyeStyle, uint8 mouthStyle, uint8 hairStyle, uint8 accessory, uint8 bgPattern) = getTraits(user);
        string memory skinColor = getSkinColor(skinTone);
        string memory hairColor = getHairColor(user);

        return string(abi.encodePacked(
            _generateSVGPart1(level, stateColor, bgPattern),
            _generateSVGPart2(skinColor, hairColor, hairStyle),
            _generateSVGPart3(eyeStyle, mouthStyle, level),
            _generateSVGPart4(accessory, stateColor, level),
            _generateSVGPart5(stateName, stateColor, total)
        ));
    }

    function _generateSVGPart1(uint256 level, string memory stateColor, uint8 bgPattern) internal pure returns (string memory) {
        string memory bgExtra = "";
        if (bgPattern == 1) {
            bgExtra = '<circle cx="50" cy="50" r="30" fill="#ffffff08"/><circle cx="350" cy="350" r="40" fill="#ffffff08"/>';
        } else if (bgPattern == 2) {
            bgExtra = '<rect x="0" y="180" width="400" height="40" fill="#ffffff05"/>';
        } else if (bgPattern == 3) {
            bgExtra = '<polygon points="200,20 380,380 20,380" fill="#ffffff03"/>';
        }

        string memory aura = "";
        if (level == BURNING) {
            aura = string(abi.encodePacked(
                '<circle cx="200" cy="160" r="120" fill="none" stroke="', stateColor, '" stroke-width="3" opacity="0.6">',
                '<animate attributeName="r" values="120;130;120" dur="0.8s" repeatCount="indefinite"/>',
                '<animate attributeName="opacity" values="0.6;0.3;0.6" dur="0.8s" repeatCount="indefinite"/>',
                '</circle>',
                '<circle cx="200" cy="160" r="140" fill="none" stroke="', stateColor, '" stroke-width="2" opacity="0.3">',
                '<animate attributeName="r" values="140;155;140" dur="1s" repeatCount="indefinite"/>',
                '</circle>'
            ));
        } else if (level == ACTIVE) {
            aura = string(abi.encodePacked(
                '<circle cx="200" cy="160" r="115" fill="none" stroke="', stateColor, '" stroke-width="2" opacity="0.4"/>'
            ));
        }

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs>',
            '<radialGradient id="bg" cx="50%" cy="30%" r="70%">',
            '<stop offset="0%" style="stop-color:#2a2a4a"/>',
            '<stop offset="100%" style="stop-color:#1a1a2e"/>',
            '</radialGradient>',
            '<radialGradient id="skin" cx="50%" cy="40%" r="50%">',
            '<stop offset="0%" style="stop-color:#ffffff20"/>',
            '<stop offset="100%" style="stop-color:#00000020"/>',
            '</radialGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            bgExtra,
            aura
        ));
    }

    function _generateSVGPart2(string memory skinColor, string memory hairColor, uint8 hairStyle) internal pure returns (string memory) {
        string memory hair;
        if (hairStyle == 0) {
            // Short hair
            hair = string(abi.encodePacked(
                '<ellipse cx="200" cy="100" rx="75" ry="45" fill="', hairColor, '"/>',
                '<rect x="125" y="95" width="150" height="30" fill="', hairColor, '"/>'
            ));
        } else if (hairStyle == 1) {
            // Spiky hair
            hair = string(abi.encodePacked(
                '<path d="M130 120 L150 60 L170 110 L190 50 L210 105 L230 55 L250 110 L270 65 L270 120 Z" fill="', hairColor, '"/>'
            ));
        } else if (hairStyle == 2) {
            // Long hair
            hair = string(abi.encodePacked(
                '<ellipse cx="200" cy="105" rx="80" ry="50" fill="', hairColor, '"/>',
                '<rect x="120" y="100" width="30" height="120" rx="15" fill="', hairColor, '"/>',
                '<rect x="250" y="100" width="30" height="120" rx="15" fill="', hairColor, '"/>'
            ));
        } else if (hairStyle == 3) {
            // Mohawk
            hair = string(abi.encodePacked(
                '<rect x="185" y="50" width="30" height="70" rx="10" fill="', hairColor, '"/>'
            ));
        } else if (hairStyle == 4) {
            // Curly/Afro
            hair = string(abi.encodePacked(
                '<circle cx="200" cy="95" r="70" fill="', hairColor, '"/>'
            ));
        } else {
            // Bald - no hair
            hair = "";
        }

        return string(abi.encodePacked(
            // Neck
            '<rect x="175" y="210" width="50" height="40" fill="', skinColor, '"/>',
            // Face
            '<ellipse cx="200" cy="160" rx="70" ry="80" fill="', skinColor, '"/>',
            '<ellipse cx="200" cy="160" rx="70" ry="80" fill="url(#skin)"/>',
            // Ears
            '<ellipse cx="130" cy="160" rx="12" ry="20" fill="', skinColor, '"/>',
            '<ellipse cx="270" cy="160" rx="12" ry="20" fill="', skinColor, '"/>',
            hair
        ));
    }

    function _generateSVGPart3(uint8 eyeStyle, uint8 mouthStyle, uint256 level) internal pure returns (string memory) {
        string memory eyes;
        if (eyeStyle == 0) {
            // Normal eyes
            eyes = '<ellipse cx="170" cy="150" rx="12" ry="14" fill="white"/><ellipse cx="230" cy="150" rx="12" ry="14" fill="white"/><circle cx="172" cy="152" r="6" fill="#1a1a2e"/><circle cx="232" cy="152" r="6" fill="#1a1a2e"/><circle cx="174" cy="150" r="2" fill="white"/><circle cx="234" cy="150" r="2" fill="white"/>';
        } else if (eyeStyle == 1) {
            // Round eyes
            eyes = '<circle cx="170" cy="150" r="14" fill="white"/><circle cx="230" cy="150" r="14" fill="white"/><circle cx="172" cy="152" r="7" fill="#4a3728"/><circle cx="232" cy="152" r="7" fill="#4a3728"/><circle cx="174" cy="150" r="2" fill="white"/><circle cx="234" cy="150" r="2" fill="white"/>';
        } else if (eyeStyle == 2) {
            // Narrow eyes
            eyes = '<ellipse cx="170" cy="150" rx="15" ry="8" fill="white"/><ellipse cx="230" cy="150" rx="15" ry="8" fill="white"/><ellipse cx="172" cy="150" rx="5" ry="6" fill="#2d5a27"/><ellipse cx="232" cy="150" rx="5" ry="6" fill="#2d5a27"/>';
        } else if (eyeStyle == 3) {
            // Cute eyes
            eyes = '<ellipse cx="170" cy="150" rx="14" ry="16" fill="white"/><ellipse cx="230" cy="150" rx="14" ry="16" fill="white"/><ellipse cx="172" cy="154" rx="8" ry="10" fill="#1a1a2e"/><ellipse cx="232" cy="154" rx="8" ry="10" fill="#1a1a2e"/><ellipse cx="175" cy="150" rx="3" ry="4" fill="white"/><ellipse cx="235" cy="150" rx="3" ry="4" fill="white"/>';
        } else {
            // Sleepy eyes
            eyes = '<path d="M155 150 Q170 145 185 150" stroke="#1a1a2e" stroke-width="3" fill="none"/><path d="M215 150 Q230 145 245 150" stroke="#1a1a2e" stroke-width="3" fill="none"/>';
        }

        // Add eye glow effect for burning state
        if (level == BURNING) {
            eyes = string(abi.encodePacked(
                '<ellipse cx="170" cy="150" rx="16" ry="16" fill="#FF6B3540"/>',
                '<ellipse cx="230" cy="150" rx="16" ry="16" fill="#FF6B3540"/>',
                eyes
            ));
        }

        string memory mouth;
        if (mouthStyle == 0) {
            // Smile
            mouth = '<path d="M170 195 Q200 220 230 195" stroke="#c4846c" stroke-width="4" fill="none" stroke-linecap="round"/>';
        } else if (mouthStyle == 1) {
            // Grin
            mouth = '<path d="M165 190 Q200 225 235 190" stroke="#c4846c" stroke-width="3" fill="#fff" stroke-linecap="round"/>';
        } else if (mouthStyle == 2) {
            // Neutral
            mouth = '<line x1="175" y1="195" x2="225" y2="195" stroke="#c4846c" stroke-width="3" stroke-linecap="round"/>';
        } else {
            // Small smile
            mouth = '<path d="M185 195 Q200 205 215 195" stroke="#c4846c" stroke-width="3" fill="none" stroke-linecap="round"/>';
        }

        // Eyebrows
        string memory eyebrows = '<path d="M155 130 Q170 125 185 130" stroke="#5c4033" stroke-width="3" fill="none"/><path d="M215 130 Q230 125 245 130" stroke="#5c4033" stroke-width="3" fill="none"/>';

        // Nose
        string memory nose = '<path d="M200 160 L195 180 Q200 185 205 180 L200 160" fill="#00000015"/>';

        // Blush for active/burning
        string memory blush = "";
        if (level >= ACTIVE) {
            blush = '<ellipse cx="150" cy="175" rx="15" ry="8" fill="#ff9999" opacity="0.3"/><ellipse cx="250" cy="175" rx="15" ry="8" fill="#ff9999" opacity="0.3"/>';
        }

        return string(abi.encodePacked(eyes, eyebrows, nose, mouth, blush));
    }

    function _generateSVGPart4(uint8 accessory, string memory stateColor, uint256 level) internal pure returns (string memory) {
        string memory acc = "";
        if (accessory == 1) {
            // Glasses
            acc = '<circle cx="170" cy="150" r="20" fill="none" stroke="#333" stroke-width="3"/><circle cx="230" cy="150" r="20" fill="none" stroke="#333" stroke-width="3"/><line x1="190" y1="150" x2="210" y2="150" stroke="#333" stroke-width="3"/><line x1="130" y1="150" x2="150" y2="150" stroke="#333" stroke-width="2"/><line x1="250" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/>';
        } else if (accessory == 2) {
            // Earrings
            acc = '<circle cx="130" cy="175" r="5" fill="#ffd700"/><circle cx="270" cy="175" r="5" fill="#ffd700"/>';
        } else if (accessory == 3) {
            // Headband
            acc = string(abi.encodePacked('<rect x="125" y="105" width="150" height="10" rx="5" fill="', stateColor, '"/>'));
        } else if (accessory == 4) {
            // Star mark
            acc = '<polygon points="200,70 203,78 212,78 205,83 208,92 200,87 192,92 195,83 188,78 197,78" fill="#ffd700"/>';
        }

        // State indicator badge
        string memory badge = string(abi.encodePacked(
            '<circle cx="280" cy="80" r="25" fill="', stateColor, '"/>',
            '<circle cx="280" cy="80" r="20" fill="#1a1a2e"/>'
        ));

        if (level == BURNING) {
            badge = string(abi.encodePacked(
                badge,
                '<path d="M280 65 L285 80 L280 75 L275 80 Z" fill="', stateColor, '">',
                '<animate attributeName="d" values="M280 65 L285 80 L280 75 L275 80 Z;M280 60 L287 82 L280 75 L273 82 Z;M280 65 L285 80 L280 75 L275 80 Z" dur="0.5s" repeatCount="indefinite"/>',
                '</path>'
            ));
        } else if (level == ACTIVE) {
            badge = string(abi.encodePacked(badge, '<circle cx="280" cy="80" r="8" fill="', stateColor, '"/>'));
        } else {
            badge = string(abi.encodePacked(badge, '<circle cx="280" cy="80" r="5" fill="', stateColor, '" opacity="0.5"/>'));
        }

        return string(abi.encodePacked(acc, badge));
    }

    function _generateSVGPart5(string memory stateName, string memory stateColor, uint256 total) internal pure returns (string memory) {
        return string(abi.encodePacked(
            // Shoulders hint
            '<ellipse cx="200" cy="280" rx="90" ry="40" fill="#2a2a4a"/>',
            // Name plate
            '<rect x="100" y="320" width="200" height="60" rx="10" fill="#1a1a2e" stroke="', stateColor, '" stroke-width="2"/>',
            '<text x="200" y="348" text-anchor="middle" fill="white" font-size="18" font-family="Arial, sans-serif" font-weight="bold">', stateName, '</text>',
            '<text x="200" y="368" text-anchor="middle" fill="', stateColor, '" font-size="12" font-family="Arial, sans-serif">', total.toString(), ' interactions</text>',
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
