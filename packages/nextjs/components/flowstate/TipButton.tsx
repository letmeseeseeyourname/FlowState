"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import { useTipModule, TIP_PRESETS, MIN_TIP_AMOUNT } from "~~/hooks/flowstate/useTipModule";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

interface TipButtonProps {
  targetAddress: `0x${string}`;
  onSuccess?: () => void;
  size?: "sm" | "md" | "lg";
  showPresets?: boolean;
}

export function TipButton({
  targetAddress,
  onSuccess,
  size = "md",
  showPresets = true,
}: TipButtonProps) {
  const { address } = useAccount();
  const { tip, isTipping, isTipSuccess } = useTipModule();
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTip = async (amount: string) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }
    if (address === targetAddress) {
      notification.error("Cannot tip yourself");
      return;
    }
    if (parseFloat(amount) < parseFloat(MIN_TIP_AMOUNT)) {
      notification.error(`Minimum tip amount is ${MIN_TIP_AMOUNT} ETH`);
      return;
    }
    await tip(targetAddress, amount);
  };

  const handleCustomTip = () => {
    if (!customAmount || parseFloat(customAmount) < parseFloat(MIN_TIP_AMOUNT)) {
      notification.error(`Minimum tip amount is ${MIN_TIP_AMOUNT} ETH`);
      return;
    }
    handleTip(customAmount);
    setCustomAmount("");
    setShowCustomInput(false);
  };

  useEffect(() => {
    if (isTipSuccess) {
      notification.success("Tip sent!");
      onSuccess?.();
    }
  }, [isTipSuccess, onSuccess]);

  const sizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  const isDisabled = isTipping || address === targetAddress;

  if (showCustomInput) {
    return (
      <div className="flex gap-2 items-center">
        <input
          type="number"
          className="input input-bordered input-sm w-24"
          placeholder="Amount"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          step="0.001"
          min={MIN_TIP_AMOUNT}
        />
        <button
          className={clsx("btn btn-accent", sizeClasses[size])}
          onClick={handleCustomTip}
          disabled={isDisabled}
        >
          {isTipping ? <span className="loading loading-spinner loading-xs" /> : "Send"}
        </button>
        <button
          className={clsx("btn btn-ghost", sizeClasses[size])}
          onClick={() => setShowCustomInput(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {showPresets &&
        TIP_PRESETS.map(amount => (
          <button
            key={amount}
            className={clsx("btn btn-accent", sizeClasses[size])}
            onClick={() => handleTip(amount)}
            disabled={isDisabled}
          >
            {isTipping ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                <CurrencyDollarIcon className="w-4 h-4" />
                {amount}
              </>
            )}
          </button>
        ))}
      <button
        className={clsx("btn btn-outline btn-accent", sizeClasses[size])}
        onClick={() => setShowCustomInput(true)}
        disabled={isDisabled}
      >
        Custom
      </button>
    </div>
  );
}

// Simple tip button that just tips a preset amount
export function QuickTipButton({
  targetAddress,
  amount = "0.001",
  onSuccess,
  size = "md",
}: {
  targetAddress: `0x${string}`;
  amount?: string;
  onSuccess?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const { address } = useAccount();
  const { tip, isTipping, isTipSuccess } = useTipModule();

  const handleTip = async () => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }
    if (address === targetAddress) {
      notification.error("Cannot tip yourself");
      return;
    }
    await tip(targetAddress, amount);
  };

  useEffect(() => {
    if (isTipSuccess) {
      notification.success("Tip sent!");
      onSuccess?.();
    }
  }, [isTipSuccess, onSuccess]);

  const sizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      className={clsx("btn btn-accent gap-2", sizeClasses[size])}
      onClick={handleTip}
      disabled={isTipping || address === targetAddress}
    >
      {isTipping ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <>
          <CurrencyDollarIcon className="w-4 h-4" />
          Tip {amount} ETH
        </>
      )}
    </button>
  );
}
