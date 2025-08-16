"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { sepolia, baseSepolia } from "wagmi/chains";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => {
    return getDefaultConfig({
      appName: "Omnichain Kiosk",
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "CHANGE_ME",
      chains: [sepolia, baseSepolia],
      transports: {
        [sepolia.id]: http(),
        [baseSepolia.id]: http(),
      },
      ssr: true,
    });
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            borderRadius: "large",
            accentColor: "#0ea5e9",
            overlayBlur: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 