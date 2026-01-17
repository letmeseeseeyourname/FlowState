import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "./Header";
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
