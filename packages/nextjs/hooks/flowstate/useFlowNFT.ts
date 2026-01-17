"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useDeployedContractInfo } from "../scaffold-eth/useDeployedContractInfo";
import { notification } from "~~/utils/scaffold-eth";

export interface FlowState {
  currentEpoch: bigint;
  likesReceived: bigint;
  likesSent: bigint;
  tipsReceived: bigint;
  tipsSent: bigint;
  totalInteractions: bigint;
  stateLevel: bigint;
}

export function useFlowNFT() {
  const { address } = useAccount();
  const { data: contractInfo } = useDeployedContractInfo("FlowNFT");

  // Check if user has minted
  const { data: hasMinted, refetch: refetchHasMinted } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "hasMinted",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get user's token ID
  const { data: tokenId, refetch: refetchTokenId } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "tokenOfOwner",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo && !!hasMinted,
      refetchInterval: 3000,
    },
  });

  // Get flow state
  const { data: flowStateData, refetch: refetchFlowState } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "getFlowState",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get token URI
  const { data: tokenURI, refetch: refetchTokenURI } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && !!contractInfo,
      refetchInterval: 5000,
    },
  });

  // Mint function
  const { writeContract: mint, isPending: isMinting, data: mintTxHash } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  const handleMint = async () => {
    if (!contractInfo) return;

    try {
      mint({
        address: contractInfo.address,
        abi: contractInfo.abi,
        functionName: "mint",
      });
    } catch (error) {
      console.error("Mint error:", error);
      notification.error("Failed to mint NFT");
    }
  };

  // Parse flow state
  const flowState: FlowState | undefined = flowStateData
    ? {
        currentEpoch: (flowStateData as bigint[])[0],
        likesReceived: (flowStateData as bigint[])[1],
        likesSent: (flowStateData as bigint[])[2],
        tipsReceived: (flowStateData as bigint[])[3],
        tipsSent: (flowStateData as bigint[])[4],
        totalInteractions: (flowStateData as bigint[])[5],
        stateLevel: (flowStateData as bigint[])[6],
      }
    : undefined;

  const refetchAll = () => {
    refetchHasMinted();
    refetchTokenId();
    refetchFlowState();
    refetchTokenURI();
  };

  return {
    address,
    hasMinted: hasMinted as boolean | undefined,
    tokenId: tokenId as bigint | undefined,
    flowState,
    tokenURI: tokenURI as string | undefined,
    mint: handleMint,
    isMinting: isMinting || isMintConfirming,
    isMintSuccess,
    refetchAll,
  };
}

export function useFlowNFTForAddress(targetAddress: `0x${string}` | undefined) {
  const { data: contractInfo } = useDeployedContractInfo("FlowNFT");

  // Check if user has minted
  const { data: hasMinted } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "hasMinted",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get user's token ID
  const { data: tokenId } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "tokenOfOwner",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!contractInfo && !!hasMinted,
      refetchInterval: 3000,
    },
  });

  // Get flow state
  const { data: flowStateData, refetch: refetchFlowState } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "getFlowState",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!contractInfo,
      refetchInterval: 3000,
    },
  });

  // Get token URI
  const { data: tokenURI } = useReadContract({
    address: contractInfo?.address,
    abi: contractInfo?.abi,
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && !!contractInfo,
      refetchInterval: 5000,
    },
  });

  // Parse flow state
  const flowState: FlowState | undefined = flowStateData
    ? {
        currentEpoch: (flowStateData as bigint[])[0],
        likesReceived: (flowStateData as bigint[])[1],
        likesSent: (flowStateData as bigint[])[2],
        tipsReceived: (flowStateData as bigint[])[3],
        tipsSent: (flowStateData as bigint[])[4],
        totalInteractions: (flowStateData as bigint[])[5],
        stateLevel: (flowStateData as bigint[])[6],
      }
    : undefined;

  return {
    address: targetAddress,
    hasMinted: hasMinted as boolean | undefined,
    tokenId: tokenId as bigint | undefined,
    flowState,
    tokenURI: tokenURI as string | undefined,
    refetchFlowState,
  };
}
