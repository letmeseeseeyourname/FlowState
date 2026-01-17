"use client";

import { parseEther, formatEther } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useDeployedContractInfo } from "../scaffold-eth/useDeployedContractInfo";
import { notification } from "~~/utils/scaffold-eth";

export const MIN_TIP_AMOUNT = "0.0001"; // ETH
export const TIP_PRESETS = ["0.001", "0.01", "0.1"]; // ETH

export function useTipModule() {
  const { address } = useAccount();
  const { data: contractInfo } = useDeployedContractInfo("TipModule");

  // Get pending withdrawals for current user
  const { data: pendingWithdrawal, refetch: refetchPendingWithdrawal } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "pendingWithdrawals",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get total tips received
  const { data: totalReceived, refetch: refetchTotalReceived } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "totalTipsReceived",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get total tips sent
  const { data: totalSent, refetch: refetchTotalSent } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "totalTipsSent",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Tip function
  const { writeContract: tipWrite, isPending: isTipping, data: tipTxHash } = useWriteContract();

  const { isLoading: isTipConfirming, isSuccess: isTipSuccess } = useWaitForTransactionReceipt({
    hash: tipTxHash,
  });

  const tip = async (recipientAddress: `0x${string}`, amount: string) => {
    if (!contractInfo) {
      notification.error("Contract not loaded");
      return;
    }

    const amountWei = parseEther(amount);

    try {
      tipWrite({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "tip",
        args: [recipientAddress],
        value: amountWei,
      });
    } catch (error) {
      console.error("Tip error:", error);
      notification.error("Failed to send tip");
    }
  };

  // Withdraw function
  const { writeContract: withdrawWrite, isPending: isWithdrawing, data: withdrawTxHash } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  const withdraw = async () => {
    if (!contractInfo) {
      notification.error("Contract not loaded");
      return;
    }

    try {
      withdrawWrite({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "withdraw",
      });
    } catch (error) {
      console.error("Withdraw error:", error);
      notification.error("Failed to withdraw");
    }
  };

  const refetchAll = () => {
    refetchPendingWithdrawal();
    refetchTotalReceived();
    refetchTotalSent();
  };

  return {
    pendingWithdrawal: pendingWithdrawal as bigint | undefined,
    pendingWithdrawalFormatted: pendingWithdrawal ? formatEther(pendingWithdrawal as bigint) : "0",
    totalReceived: totalReceived as bigint | undefined,
    totalReceivedFormatted: totalReceived ? formatEther(totalReceived as bigint) : "0",
    totalSent: totalSent as bigint | undefined,
    totalSentFormatted: totalSent ? formatEther(totalSent as bigint) : "0",
    tip,
    isTipping: isTipping || isTipConfirming,
    isTipSuccess,
    withdraw,
    isWithdrawing: isWithdrawing || isWithdrawConfirming,
    isWithdrawSuccess,
    refetchAll,
    contractInfo,
  };
}

export function useTipModuleForAddress(targetAddress: `0x${string}` | undefined) {
  const { data: contractInfo } = useDeployedContractInfo("TipModule");

  // Get pending withdrawals for target
  const { data: pendingWithdrawal } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "pendingWithdrawals",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get total tips received
  const { data: totalReceived } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "totalTipsReceived",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  return {
    pendingWithdrawal: pendingWithdrawal as bigint | undefined,
    pendingWithdrawalFormatted: pendingWithdrawal ? formatEther(pendingWithdrawal as bigint) : "0",
    totalReceived: totalReceived as bigint | undefined,
    totalReceivedFormatted: totalReceived ? formatEther(totalReceived as bigint) : "0",
  };
}
