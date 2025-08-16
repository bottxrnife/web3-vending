"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider, http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia, baseSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
	const config = useMemo(() => {
		const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
		return createConfig({
			chains: [sepolia, baseSepolia],
			transports: {
				[sepolia.id]: http(),
				[baseSepolia.id]: http(),
			},
			ssr: true,
			connectors: [
				walletConnect({
					projectId,
					showQrModal: true, // ensure QR-only modal appears
				}),
			],
		});
	}, []);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</WagmiProvider>
	);
} 