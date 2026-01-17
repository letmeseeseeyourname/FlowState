import type { Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowState - Dynamic NFT Social Protocol",
  description:
    "Realtime Dynamic NFT Social Protocol on Monad. Your evolving on-chain identity.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          <Header />
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}

function Header() {
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
        <w3m-button />
      </div>
    </header>
  );
}
