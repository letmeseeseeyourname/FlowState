"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { FlowState } from "~~/hooks/flowstate/useFlowNFT";

interface FlowNFTCardProps {
  address: `0x${string}`;
  flowState?: FlowState;
  tokenURI?: string;
  tokenId?: bigint;
  showActions?: boolean;
  onLike?: () => void;
  onTip?: (amount: string) => void;
  isLiking?: boolean;
  isTipping?: boolean;
  hasLiked?: boolean;
}

const STATE_NAMES = ["Idle", "Active", "Burning"];
const STATE_COLORS = ["#95A5A6", "#4ECDC4", "#FF6B35"];
const STATE_BG_CLASSES = [
  "bg-gray-500/20 border-gray-500/30",
  "bg-cyan-500/20 border-cyan-500/30",
  "bg-orange-500/20 border-orange-500/30",
];

export function FlowNFTCard({
  address,
  flowState,
  tokenURI,
  tokenId,
  showActions = true,
  onLike,
  onTip,
  isLiking,
  isTipping,
  hasLiked,
}: FlowNFTCardProps) {
  const stateLevel = flowState ? Number(flowState.stateLevel) : 0;
  const stateName = STATE_NAMES[stateLevel] || "Idle";
  const stateColor = STATE_COLORS[stateLevel] || STATE_COLORS[0];

  // Parse SVG from tokenURI
  const svgImage = useMemo(() => {
    if (!tokenURI) return null;
    try {
      const base64Json = tokenURI.split(",")[1];
      const json = JSON.parse(atob(base64Json));
      return json.image;
    } catch {
      return null;
    }
  }, [tokenURI]);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div
      className={clsx(
        "card w-80 shadow-xl border-2 transition-all duration-300",
        STATE_BG_CLASSES[stateLevel],
        stateLevel === 2 && "animate-pulse"
      )}
      style={{ boxShadow: `0 0 20px ${stateColor}40` }}
    >
      {/* NFT Image */}
      <figure className="px-4 pt-4">
        {svgImage ? (
          <img src={svgImage} alt="FlowNFT" className="rounded-xl w-full aspect-square object-cover" />
        ) : (
          <div className="rounded-xl w-full aspect-square bg-base-300 flex items-center justify-center">
            <span className="text-4xl opacity-50">NFT</span>
          </div>
        )}
      </figure>

      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="card-title text-lg">
            FlowNFT #{tokenId?.toString() || "?"}
          </h2>
          <div
            className="badge badge-lg font-bold"
            style={{ backgroundColor: stateColor, color: "white" }}
          >
            {stateName}
          </div>
        </div>

        {/* Address */}
        <p className="text-sm opacity-70 font-mono">{shortAddress}</p>

        {/* Stats */}
        {flowState && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="stat bg-base-200 rounded-lg p-2">
              <div className="stat-title text-xs">Likes Received</div>
              <div className="stat-value text-lg">{flowState.likesReceived.toString()}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-2">
              <div className="stat-title text-xs">Likes Sent</div>
              <div className="stat-value text-lg">{flowState.likesSent.toString()}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-2">
              <div className="stat-title text-xs">Tips Received</div>
              <div className="stat-value text-lg">{flowState.tipsReceived.toString()}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-2">
              <div className="stat-title text-xs">Tips Sent</div>
              <div className="stat-value text-lg">{flowState.tipsSent.toString()}</div>
            </div>
          </div>
        )}

        {/* Total Interactions */}
        {flowState && (
          <div className="mt-2 text-center">
            <span className="text-sm opacity-70">Total Interactions: </span>
            <span className="font-bold" style={{ color: stateColor }}>
              {flowState.totalInteractions.toString()}
            </span>
          </div>
        )}

        {/* Actions */}
        {showActions && onLike && onTip && (
          <div className="card-actions justify-center mt-4 gap-2">
            <button
              className={clsx(
                "btn btn-sm",
                hasLiked ? "btn-disabled" : "btn-primary"
              )}
              onClick={onLike}
              disabled={isLiking || hasLiked}
            >
              {isLiking ? (
                <span className="loading loading-spinner loading-xs" />
              ) : hasLiked ? (
                "Liked"
              ) : (
                "Like"
              )}
            </button>
            <button
              className="btn btn-sm btn-accent"
              onClick={() => onTip("0.001")}
              disabled={isTipping}
            >
              {isTipping ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Tip 0.001"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FlowNFTCardSkeleton() {
  return (
    <div className="card w-80 shadow-xl border-2 border-base-300 animate-pulse">
      <figure className="px-4 pt-4">
        <div className="rounded-xl w-full aspect-square bg-base-300" />
      </figure>
      <div className="card-body">
        <div className="h-6 bg-base-300 rounded w-3/4" />
        <div className="h-4 bg-base-300 rounded w-1/2 mt-2" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="h-16 bg-base-300 rounded" />
          <div className="h-16 bg-base-300 rounded" />
          <div className="h-16 bg-base-300 rounded" />
          <div className="h-16 bg-base-300 rounded" />
        </div>
      </div>
    </div>
  );
}
