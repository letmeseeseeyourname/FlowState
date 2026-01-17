"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { HeartIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { useActivityTracker, useHasLiked } from "~~/hooks/flowstate/useActivityTracker";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

interface LikeButtonProps {
  targetAddress: `0x${string}`;
  onSuccess?: () => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function LikeButton({
  targetAddress,
  onSuccess,
  size = "md",
  showLabel = true,
}: LikeButtonProps) {
  const { address } = useAccount();
  const { like, isLiking, isLikeSuccess } = useActivityTracker();
  const { hasLiked, refetch } = useHasLiked(address, targetAddress);

  const handleLike = async () => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }
    if (address === targetAddress) {
      notification.error("Cannot like yourself");
      return;
    }
    await like(targetAddress);
  };

  useEffect(() => {
    if (isLikeSuccess) {
      notification.success("Liked!");
      refetch();
      onSuccess?.();
    }
  }, [isLikeSuccess, refetch, onSuccess]);

  const sizeClasses = {
    sm: "btn-sm gap-1",
    md: "btn-md gap-2",
    lg: "btn-lg gap-2",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const isDisabled = isLiking || hasLiked || address === targetAddress;

  return (
    <button
      className={clsx(
        "btn",
        sizeClasses[size],
        hasLiked ? "btn-secondary" : "btn-primary",
        isDisabled && "btn-disabled"
      )}
      onClick={handleLike}
      disabled={isDisabled}
    >
      {isLiking ? (
        <span className="loading loading-spinner" />
      ) : hasLiked ? (
        <HeartIcon className={clsx(iconSizes[size], "text-red-500")} />
      ) : (
        <HeartOutlineIcon className={iconSizes[size]} />
      )}
      {showLabel && (hasLiked ? "Liked" : "Like")}
    </button>
  );
}
