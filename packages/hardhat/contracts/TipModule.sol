// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FlowNFT.sol";

/**
 * @title TipModule
 * @dev Handles micro-tipping between FlowNFT holders
 * Supports high-frequency, low-value tips optimized for Monad
 */
contract TipModule is ReentrancyGuard {
    // Minimum tip amount: 0.0001 ETH
    uint256 public constant MIN_TIP_AMOUNT = 100000000000000; // 0.0001 ether

    // Reference to FlowNFT contract
    FlowNFT public flowNFT;

    // Track pending withdrawals (pull pattern for security)
    mapping(address => uint256) public pendingWithdrawals;

    // Total tips received by each user
    mapping(address => uint256) public totalTipsReceived;

    // Total tips sent by each user
    mapping(address => uint256) public totalTipsSent;

    // Events
    event Tipped(address indexed from, address indexed to, uint256 amount, uint256 epoch);
    event Withdrawn(address indexed user, uint256 amount);

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
     * @dev Tip another FlowNFT holder
     * @param recipient The address to tip
     */
    function tip(address recipient) external payable nonReentrant {
        require(recipient != msg.sender, "Cannot tip yourself");
        require(recipient != address(0), "Invalid recipient");
        require(msg.value >= MIN_TIP_AMOUNT, "Tip amount too small");
        require(flowNFT.hasMinted(msg.sender), "Must own FlowNFT to tip");
        require(flowNFT.hasMinted(recipient), "Recipient must own FlowNFT");

        // Add to recipient's pending withdrawals
        pendingWithdrawals[recipient] += msg.value;

        // Track total amounts
        totalTipsReceived[recipient] += msg.value;
        totalTipsSent[msg.sender] += msg.value;

        // Update FlowNFT state for both parties
        flowNFT.recordTip(msg.sender, recipient);

        emit Tipped(msg.sender, recipient, msg.value, getCurrentEpoch());
    }

    /**
     * @dev Withdraw accumulated tips
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No tips to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Get pending withdrawal amount for a user
     */
    function getPendingWithdrawal(address user) external view returns (uint256) {
        return pendingWithdrawals[user];
    }

    /**
     * @dev Batch tip multiple users
     * @param recipients Array of addresses to tip
     * @param amounts Array of amounts to tip each recipient
     */
    function batchTip(address[] calldata recipients, uint256[] calldata amounts) external payable nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(flowNFT.hasMinted(msg.sender), "Must own FlowNFT to tip");

        uint256 totalSent = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            if (recipient == msg.sender || recipient == address(0)) continue;
            if (amount < MIN_TIP_AMOUNT) continue;
            if (!flowNFT.hasMinted(recipient)) continue;

            pendingWithdrawals[recipient] += amount;
            totalTipsReceived[recipient] += amount;
            totalTipsSent[msg.sender] += amount;
            totalSent += amount;

            flowNFT.recordTip(msg.sender, recipient);

            emit Tipped(msg.sender, recipient, amount, getCurrentEpoch());
        }

        require(totalSent == msg.value, "Incorrect ETH amount");
    }
}
