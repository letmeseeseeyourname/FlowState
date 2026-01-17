// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FlowNFT.sol";

/**
 * @title ActivityTracker
 * @dev Tracks social activities (likes) and updates FlowNFT state
 */
contract ActivityTracker {
    // Reference to FlowNFT contract
    FlowNFT public flowNFT;

    // Track likes: from => to => epoch => liked
    mapping(address => mapping(address => mapping(uint256 => bool))) public hasLiked;

    // Events
    event Liked(address indexed from, address indexed to, uint256 epoch);

    constructor(address _flowNFT) {
        flowNFT = FlowNFT(_flowNFT);
    }

    /**
     * @dev Get current epoch
     */
    function getCurrentEpoch() public view returns (uint256) {
        return block.timestamp / 60;
    }

    /**
     * @dev Like another user. Can only like same user once per epoch.
     * @param target The address to like
     */
    function like(address target) external {
        require(target != msg.sender, "Cannot like yourself");
        require(target != address(0), "Invalid target");
        require(flowNFT.hasMinted(msg.sender), "Must own FlowNFT to like");
        require(flowNFT.hasMinted(target), "Target must own FlowNFT");

        uint256 epoch = getCurrentEpoch();
        require(!hasLiked[msg.sender][target][epoch], "Already liked this epoch");

        hasLiked[msg.sender][target][epoch] = true;

        // Update FlowNFT state for both parties
        flowNFT.recordLike(msg.sender, target);

        emit Liked(msg.sender, target, epoch);
    }

    /**
     * @dev Check if user has liked target in current epoch
     */
    function hasLikedInEpoch(address from, address target) external view returns (bool) {
        return hasLiked[from][target][getCurrentEpoch()];
    }

    /**
     * @dev Batch like multiple users in one transaction
     * @param targets Array of addresses to like
     */
    function batchLike(address[] calldata targets) external {
        uint256 epoch = getCurrentEpoch();
        require(flowNFT.hasMinted(msg.sender), "Must own FlowNFT to like");

        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];

            if (target == msg.sender || target == address(0)) continue;
            if (!flowNFT.hasMinted(target)) continue;
            if (hasLiked[msg.sender][target][epoch]) continue;

            hasLiked[msg.sender][target][epoch] = true;
            flowNFT.recordLike(msg.sender, target);

            emit Liked(msg.sender, target, epoch);
        }
    }
}
