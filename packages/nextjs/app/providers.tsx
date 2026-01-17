"use client";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { defineChain } from "viem";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// Define Monad Testnet
const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

// WalletConnect project ID (get your own at https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo-project-id";

// Create wagmi config
const config = createConfig({
  chains: [monadTestnet, hardhat],
  transports: {
    [monadTestnet.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: false }),
    coinbaseWallet({ appName: "FlowState" }),
  ],
});

// Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#4ECDC4",
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 3000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
