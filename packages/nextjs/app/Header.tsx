"use client";

import { useEffect, useState } from "react";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="navbar bg-base-200 shadow-lg">
      <div className="flex-1">
        <a href="/" className="btn btn-ghost text-xl font-bold">
          FlowState
        </a>
      </div>
      <div className="flex-none gap-2">
        <a href="/mint" className="btn btn-ghost btn-sm">
          Mint
        </a>
        {mounted && <w3m-button />}
      </div>
    </header>
  );
}
