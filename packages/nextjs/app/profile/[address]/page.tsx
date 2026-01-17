"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useFlowNFTForAddress } from "~~/hooks/flowstate/useFlowNFT";
import { useTipModuleForAddress, useTipModule } from "~~/hooks/flowstate/useTipModule";
import { FlowNFTCard, FlowNFTCardSkeleton } from "~~/components/flowstate/FlowNFTCard";
import { StateIndicator } from "~~/components/flowstate/StateIndicator";
import { LikeButton } from "~~/components/flowstate/LikeButton";
import { TipButton } from "~~/components/flowstate/TipButton";
import { formatEther } from "viem";

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const profileAddress = params.address as `0x${string}`;

  const { address: connectedAddress } = useAccount();

  // Only check isOwnProfile after mount to avoid hydration mismatch
  const isOwnProfile = mounted && connectedAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { hasMinted, tokenId, flowState, tokenURI, refetchFlowState } =
    useFlowNFTForAddress(profileAddress);
  const { totalReceivedFormatted, pendingWithdrawalFormatted } =
    useTipModuleForAddress(profileAddress);
  const {
    pendingWithdrawal,
    withdraw,
    isWithdrawing,
    isWithdrawSuccess,
    totalSentFormatted,
    refetchAll,
  } = useTipModule();

  const handleActionSuccess = () => {
    refetchFlowState();
    refetchAll();
  };

  if (!profileAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid address</p>
      </div>
    );
  }

  if (hasMinted === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">No FlowNFT Found</h2>
          <p className="opacity-70">
            This address hasn't minted a FlowNFT yet.
          </p>
          <p className="font-mono text-sm mt-4 opacity-50">
            {profileAddress.slice(0, 10)}...{profileAddress.slice(-8)}
          </p>
        </div>
      </div>
    );
  }

  const shortAddress = `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            {isOwnProfile ? "Your Profile" : "Profile"}
          </h1>
          <p className="font-mono opacity-70">{shortAddress}</p>
        </div>

        <div className="flex flex-col lg:flex-row justify-center gap-8">
          {/* NFT Card */}
          <div className="flex justify-center">
            {hasMinted === undefined ? (
              <FlowNFTCardSkeleton />
            ) : (
              <FlowNFTCard
                address={profileAddress}
                flowState={flowState}
                tokenURI={tokenURI}
                tokenId={tokenId}
                showActions={false}
              />
            )}
          </div>

          {/* Stats & Actions */}
          <div className="max-w-md space-y-6">
            {/* State Indicator */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Flow State</h2>
                <StateIndicator flowState={flowState} size="md" />
              </div>
            </div>

            {/* Tip Stats */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Tip Statistics</h2>
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-title">Total Received</div>
                    <div className="stat-value text-lg text-success">
                      {totalReceivedFormatted} ETH
                    </div>
                  </div>
                  {isOwnProfile && (
                    <div className="stat">
                      <div className="stat-title">Pending</div>
                      <div className="stat-value text-lg text-warning">
                        {pendingWithdrawalFormatted} ETH
                      </div>
                    </div>
                  )}
                </div>

                {/* Withdraw Button (own profile only) */}
                {isOwnProfile && pendingWithdrawal && pendingWithdrawal > BigInt(0) && (
                  <button
                    className="btn btn-success mt-4"
                    onClick={withdraw}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? (
                      <>
                        <span className="loading loading-spinner" />
                        Withdrawing...
                      </>
                    ) : (
                      `Withdraw ${pendingWithdrawalFormatted} ETH`
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Interactions (for other profiles) */}
            {mounted && !isOwnProfile && connectedAddress && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Interact</h2>

                  <div className="space-y-4">
                    {/* Like */}
                    <div>
                      <p className="text-sm opacity-70 mb-2">
                        Send a like (once per epoch)
                      </p>
                      <LikeButton
                        targetAddress={profileAddress}
                        onSuccess={handleActionSuccess}
                      />
                    </div>

                    {/* Tip */}
                    <div>
                      <p className="text-sm opacity-70 mb-2">
                        Send a tip (min 0.0001 ETH)
                      </p>
                      <TipButton
                        targetAddress={profileAddress}
                        onSuccess={handleActionSuccess}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Own Profile Stats */}
            {isOwnProfile && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Your Activity</h2>
                  <div className="stats stats-vertical shadow">
                    <div className="stat">
                      <div className="stat-title">Tips Sent</div>
                      <div className="stat-value text-lg">{totalSentFormatted} ETH</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Likes Sent</div>
                      <div className="stat-value text-lg">
                        {flowState?.likesSent?.toString() || 0}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Likes Received</div>
                      <div className="stat-value text-lg">
                        {flowState?.likesReceived?.toString() || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
