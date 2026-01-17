"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useFlowNFT } from "~~/hooks/flowstate/useFlowNFT";
import { FlowNFTCard, FlowNFTCardSkeleton } from "~~/components/flowstate/FlowNFTCard";
import { StateIndicator } from "~~/components/flowstate/StateIndicator";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { hasMinted, tokenId, flowState, tokenURI } = useFlowNFT();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use mounted check to avoid hydration mismatch
  const showConnected = mounted && isConnected;
  const showMinted = mounted && hasMinted;

  return (
    <main className="min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              FlowState
            </h1>
            <p className="py-6 text-xl opacity-80">
              Realtime Dynamic NFT Social Protocol on Monad
            </p>
            <p className="text-base opacity-60 mb-8">
              Your on-chain identity that evolves based on social interactions.
              Like, tip, and watch your NFT transform in real-time.
            </p>

            {!showConnected ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg">Connect your wallet to get started</p>
                <div className="animate-bounce">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
            ) : !showMinted ? (
              <Link href="/mint" className="btn btn-primary btn-lg">
                Mint Your FlowNFT
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Link href={`/profile/${address}`} className="btn btn-primary btn-lg">
                  View Your Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's NFT Preview */}
      {showConnected && showMinted && (
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <FlowNFTCard
              address={address!}
              flowState={flowState}
              tokenURI={tokenURI}
              tokenId={tokenId}
              showActions={false}
            />
            <div className="max-w-md">
              <h2 className="text-2xl font-bold mb-4">Your FlowState</h2>
              <StateIndicator flowState={flowState} size="lg" />
              <div className="mt-6">
                <Link href={`/profile/${address}`} className="btn btn-outline">
                  Go to Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">1</div>
              <h3 className="card-title">Mint Your NFT</h3>
              <p className="opacity-70">
                One unique FlowNFT per address. Your evolving on-chain identity.
              </p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">2</div>
              <h3 className="card-title">Interact</h3>
              <p className="opacity-70">
                Like and tip other users. Every interaction updates your state.
              </p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">3</div>
              <h3 className="card-title">Evolve</h3>
              <p className="opacity-70">
                Watch your NFT transform: Idle → Active → Burning based on activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* State Levels */}
      <div className="container mx-auto px-4 py-16 bg-base-200">
        <h2 className="text-3xl font-bold text-center mb-12">State Levels</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-xl border-2 border-gray-500/30">
            <div className="card-body items-center text-center">
              <div
                className="w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "#95A5A6" }}
              />
              <h3 className="card-title">Idle</h3>
              <p className="opacity-70">0-4 interactions in the last 2 epochs</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border-2 border-cyan-500/30">
            <div className="card-body items-center text-center">
              <div
                className="w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "#4ECDC4" }}
              />
              <h3 className="card-title">Active</h3>
              <p className="opacity-70">5-19 interactions in the last 2 epochs</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border-2 border-orange-500/30">
            <div className="card-body items-center text-center">
              <div
                className="w-16 h-16 rounded-full mb-4 animate-pulse"
                style={{ backgroundColor: "#FF6B35" }}
              />
              <h3 className="card-title">Burning</h3>
              <p className="opacity-70">20+ interactions in the last 2 epochs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div>
          <p className="font-bold">FlowState</p>
          <p>Built on Monad with Scaffold-ETH 2</p>
        </div>
      </footer>
    </main>
  );
}
