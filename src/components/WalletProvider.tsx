"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider, http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, base } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
	const config = useMemo(() => {
		const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
		return createConfig({
			chains: [mainnet, base],
			transports: {
				[mainnet.id]: http(),
				[base.id]: http(),
			},
			ssr: true,
			connectors: [
				injected({ shimDisconnect: true }),
				coinbaseWallet({ appName: "Omnichain Vending", preference: "all" }),
				walletConnect({ projectId, showQrModal: false }),
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