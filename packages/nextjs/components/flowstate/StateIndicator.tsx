"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { FlowState } from "~~/hooks/flowstate/useFlowNFT";

interface StateIndicatorProps {
  flowState?: FlowState;
  showEpochCountdown?: boolean;
  size?: "sm" | "md" | "lg";
}

const STATE_NAMES = ["Idle", "Active", "Burning"];
const STATE_COLORS = ["#95A5A6", "#4ECDC4", "#FF6B35"];
const STATE_DESCRIPTIONS = [
  "0-4 interactions",
  "5-19 interactions",
  "20+ interactions",
];

export function StateIndicator({
  flowState,
  showEpochCountdown = true,
  size = "md",
}: StateIndicatorProps) {
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Calculate seconds left in current epoch
  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const epochStart = Math.floor(now / 60) * 60;
      const epochEnd = epochStart + 60;
      setSecondsLeft(epochEnd - now);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const stateLevel = flowState ? Number(flowState.stateLevel) : 0;
  const stateName = STATE_NAMES[stateLevel];
  const stateColor = STATE_COLORS[stateLevel];
  const stateDesc = STATE_DESCRIPTIONS[stateLevel];
  const totalInteractions = flowState?.totalInteractions || BigInt(0);

  // Progress to next level
  const getProgressToNext = () => {
    const total = Number(totalInteractions);
    if (stateLevel === 0) {
      return Math.min((total / 5) * 100, 100);
    } else if (stateLevel === 1) {
      return Math.min(((total - 5) / 15) * 100, 100);
    }
    return 100;
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const badgeSizes = {
    sm: "badge-sm",
    md: "badge-md",
    lg: "badge-lg",
  };

  return (
    <div className={clsx("flex flex-col gap-2", sizeClasses[size])}>
      {/* State Badge */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "badge font-bold",
            badgeSizes[size],
            stateLevel === 2 && "animate-pulse"
          )}
          style={{ backgroundColor: stateColor, color: "white" }}
        >
          {stateName}
        </div>
        <span className="opacity-70">{stateDesc}</span>
      </div>

      {/* Interaction Counter */}
      <div className="flex items-center gap-2">
        <span className="opacity-70">Interactions:</span>
        <span className="font-bold" style={{ color: stateColor }}>
          {totalInteractions.toString()}
        </span>
      </div>

      {/* Progress to Next Level */}
      {stateLevel < 2 && (
        <div className="w-full">
          <div className="flex justify-between text-xs opacity-70 mb-1">
            <span>Progress to {STATE_NAMES[stateLevel + 1]}</span>
            <span>{Math.round(getProgressToNext())}%</span>
          </div>
          <progress
            className="progress w-full"
            value={getProgressToNext()}
            max="100"
            style={{
              "--progress-color": STATE_COLORS[stateLevel + 1]
            } as React.CSSProperties}
          />
        </div>
      )}

      {/* Epoch Countdown */}
      {showEpochCountdown && (
        <div className="flex items-center gap-2 mt-1">
          <span className="opacity-70">Epoch resets in:</span>
          <span className="countdown font-mono font-bold">
            <span style={{ "--value": secondsLeft } as React.CSSProperties}>{secondsLeft}</span>s
          </span>
        </div>
      )}
    </div>
  );
}

// Compact state display for lists
export function StateIndicatorCompact({ flowState }: { flowState?: FlowState }) {
  const stateLevel = flowState ? Number(flowState.stateLevel) : 0;
  const stateName = STATE_NAMES[stateLevel];
  const stateColor = STATE_COLORS[stateLevel];

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          "w-3 h-3 rounded-full",
          stateLevel === 2 && "animate-pulse"
        )}
        style={{ backgroundColor: stateColor }}
      />
      <span className="text-sm font-medium">{stateName}</span>
      <span className="text-xs opacity-70">
        ({flowState?.totalInteractions?.toString() || 0})
      </span>
    </div>
  );
}
