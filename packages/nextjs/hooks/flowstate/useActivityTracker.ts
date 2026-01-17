"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useDeployedContractInfo } from "../scaffold-eth/useDeployedContractInfo";
import { notification } from "~~/utils/scaffold-eth";

export function useActivityTracker() {
  const { data: contractInfo } = useDeployedContractInfo("ActivityTracker");

  // Like function
  const { writeContract: likeWrite, isPending: isLiking, data: likeTxHash } = useWriteContract();

  const { isLoading: isLikeConfirming, isSuccess: isLikeSuccess } = useWaitForTransactionReceipt({
    hash: likeTxHash,
  });

  const like = async (targetAddress: `0x${string}`) => {
    if (!contractInfo) {
      notification.error("Contract not loaded");
      return;
    }

    try {
      likeWrite({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "like",
        args: [targetAddress],
      });
    } catch (error) {
      console.error("Like error:", error);
      notification.error("Failed to like");
    }
  };

  // Batch like function
  const { writeContract: batchLikeWrite, isPending: isBatchLiking, data: batchLikeTxHash } = useWriteContract();

  const { isLoading: isBatchLikeConfirming, isSuccess: isBatchLikeSuccess } = useWaitForTransactionReceipt({
    hash: batchLikeTxHash,
  });

  const batchLike = async (targetAddresses: `0x${string}`[]) => {
    if (!contractInfo) {
      notification.error("Contract not loaded");
      return;
    }

    try {
      batchLikeWrite({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "batchLike",
        args: [targetAddresses],
      });
    } catch (error) {
      console.error("Batch like error:", error);
      notification.error("Failed to batch like");
    }
  };

  return {
    like,
    isLiking: isLiking || isLikeConfirming,
    isLikeSuccess,
    batchLike,
    isBatchLiking: isBatchLiking || isBatchLikeConfirming,
    isBatchLikeSuccess,
    contractInfo,
  };
}

export function useHasLiked(fromAddress: `0x${string}` | undefined, targetAddress: `0x${string}` | undefined) {
  const { data: contractInfo } = useDeployedContractInfo("ActivityTracker");

  const { data: hasLiked, refetch } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "hasLikedInEpoch",
    args: fromAddress && targetAddress ? [fromAddress, targetAddress] : undefined,
    query: {
      enabled: !!fromAddress && !!targetAddress && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  return {
    hasLiked: hasLiked as boolean | undefined,
    refetch,
  };
}
