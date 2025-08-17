import { mainnet, base, type Chain } from "wagmi/chains";

export const SUPPORTED_CHAINS: Chain[] = [mainnet, base];

export const DEFAULT_PRICE_USDC = Number(process.env.NEXT_PUBLIC_DEFAULT_PRICE_USDC ?? 0.75);

// Display list of popular LayerZero-supported EVM chains.
// Only those present in SUPPORTED_CHAINS and configured in paymentConfig will be enabled for payment.
export const L0_CHAIN_OPTIONS: { id: number; name: string }[] = [
	{ id: 1, name: "Ethereum" },
	{ id: 8453, name: "Base" },
	{ id: 42161, name: "Arbitrum" },
	{ id: 10, name: "Optimism" },
	{ id: 137, name: "Polygon" },
	{ id: 43114, name: "Avalanche" },
	{ id: 56, name: "BNB Chain" },
	{ id: 250, name: "Fantom" },
	{ id: 324, name: "zkSync Era" },
	{ id: 1101, name: "Polygon zkEVM" },
]; 