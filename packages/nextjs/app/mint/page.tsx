"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useFlowNFT } from "~~/hooks/flowstate/useFlowNFT";
import { notification } from "~~/utils/scaffold-eth";

export default function MintPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { hasMinted, mint, isMinting, isMintSuccess, tokenURI } = useFlowNFT();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMintSuccess) {
      notification.success("NFT Minted Successfully!");
      // Redirect to profile after short delay
      setTimeout(() => {
        router.push(`/profile/${address}`);
      }, 1500);
    }
  }, [isMintSuccess, address, router]);

  // Show loading state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

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
          {/* Preview Avatar SVG */}
          <div className="w-64 h-64 rounded-xl overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="256"
              height="256"
              viewBox="0 0 400 400"
            >
              <defs>
                <radialGradient id="bg" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" style={{ stopColor: "#2a2a4a" }} />
                  <stop offset="100%" style={{ stopColor: "#1a1a2e" }} />
                </radialGradient>
                <radialGradient id="skin" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.125 }} />
                  <stop offset="100%" style={{ stopColor: "#000000", stopOpacity: 0.125 }} />
                </radialGradient>
              </defs>
              <rect width="400" height="400" fill="url(#bg)" />
              {/* Neck */}
              <rect x="175" y="210" width="50" height="40" fill="#FFDBB4" />
              {/* Face */}
              <ellipse cx="200" cy="160" rx="70" ry="80" fill="#FFDBB4" />
              <ellipse cx="200" cy="160" rx="70" ry="80" fill="url(#skin)" />
              {/* Ears */}
              <ellipse cx="130" cy="160" rx="12" ry="20" fill="#FFDBB4" />
              <ellipse cx="270" cy="160" rx="12" ry="20" fill="#FFDBB4" />
              {/* Hair */}
              <ellipse cx="200" cy="100" rx="75" ry="45" fill="#2C1810" />
              <rect x="125" y="95" width="150" height="30" fill="#2C1810" />
              {/* Eyes */}
              <ellipse cx="170" cy="150" rx="12" ry="14" fill="white" />
              <ellipse cx="230" cy="150" rx="12" ry="14" fill="white" />
              <circle cx="172" cy="152" r="6" fill="#1a1a2e" />
              <circle cx="232" cy="152" r="6" fill="#1a1a2e" />
              <circle cx="174" cy="150" r="2" fill="white" />
              <circle cx="234" cy="150" r="2" fill="white" />
              {/* Eyebrows */}
              <path d="M155 130 Q170 125 185 130" stroke="#5c4033" strokeWidth="3" fill="none" />
              <path d="M215 130 Q230 125 245 130" stroke="#5c4033" strokeWidth="3" fill="none" />
              {/* Nose */}
              <path d="M200 160 L195 180 Q200 185 205 180 L200 160" fill="#00000015" />
              {/* Mouth */}
              <path d="M170 195 Q200 220 230 195" stroke="#c4846c" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Badge */}
              <circle cx="280" cy="80" r="25" fill="#95A5A6" />
              <circle cx="280" cy="80" r="20" fill="#1a1a2e" />
              <circle cx="280" cy="80" r="5" fill="#95A5A6" opacity="0.5" />
              {/* Shoulders */}
              <ellipse cx="200" cy="280" rx="90" ry="40" fill="#2a2a4a" />
              {/* Name plate */}
              <rect x="100" y="320" width="200" height="60" rx="10" fill="#1a1a2e" stroke="#95A5A6" strokeWidth="2" />
              <text x="200" y="348" textAnchor="middle" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">
                Idle
              </text>
              <text x="200" y="368" textAnchor="middle" fill="#95A5A6" fontSize="12" fontFamily="Arial, sans-serif">
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
