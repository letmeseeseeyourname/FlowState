"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useFlowNFT } from "~~/hooks/flowstate/useFlowNFT";
import { notification } from "~~/utils/scaffold-eth";

export default function MintPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { hasMinted, mint, isMinting, isMintSuccess, tokenURI } = useFlowNFT();

  useEffect(() => {
    if (isMintSuccess) {
      notification.success("NFT Minted Successfully!");
      // Redirect to profile after short delay
      setTimeout(() => {
        router.push(`/profile/${address}`);
      }, 1500);
    }
  }, [isMintSuccess, address, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="opacity-70">Please connect your wallet to mint a FlowNFT</p>
        </div>
      </div>
    );
  }

  if (hasMinted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Already Minted</h2>
          <p className="opacity-70 mb-6">
            You already have a FlowNFT. Each address can only mint one.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/profile/${address}`)}
          >
            View Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-300 via-base-100 to-base-300">
      <div className="card bg-base-100 shadow-2xl max-w-lg">
        <figure className="px-10 pt-10">
          {/* Preview SVG */}
          <div className="w-64 h-64 rounded-xl overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="256"
              height="256"
              viewBox="0 0 400 400"
            >
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style={{ stopColor: "#95A5A6", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#95A5A6", stopOpacity: 0.3 }} />
                </radialGradient>
              </defs>
              <rect width="400" height="400" fill="#1a1a2e" />
              <circle cx="200" cy="180" r="80" fill="url(#glow)" />
              <text
                x="200"
                y="300"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontFamily="Arial"
              >
                Idle
              </text>
              <text
                x="200"
                y="340"
                textAnchor="middle"
                fill="#95A5A6"
                fontSize="18"
                fontFamily="Arial"
              >
                0 interactions
              </text>
            </svg>
          </div>
        </figure>

        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl">Mint Your FlowNFT</h2>
          <p className="opacity-70 mb-4">
            Your unique, evolving on-chain social identity. This NFT will change based on
            your interactions with others.
          </p>

          <div className="bg-base-200 rounded-lg p-4 w-full mb-4">
            <h3 className="font-bold mb-2">What you get:</h3>
            <ul className="text-left text-sm opacity-70 space-y-1">
              <li>• One unique FlowNFT per address</li>
              <li>• Dynamic metadata that updates in real-time</li>
              <li>• Visual state changes based on activity</li>
              <li>• Ability to like and tip other users</li>
            </ul>
          </div>

          <div className="bg-base-200 rounded-lg p-4 w-full mb-6">
            <h3 className="font-bold mb-2">State Levels:</h3>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-500 mx-auto mb-1" />
                <span className="text-xs">Idle</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ backgroundColor: "#4ECDC4" }} />
                <span className="text-xs">Active</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1 animate-pulse" style={{ backgroundColor: "#FF6B35" }} />
                <span className="text-xs">Burning</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={mint}
            disabled={isMinting}
          >
            {isMinting ? (
              <>
                <span className="loading loading-spinner" />
                Minting...
              </>
            ) : (
              "Mint FlowNFT"
            )}
          </button>

          <p className="text-xs opacity-50 mt-4">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
}
