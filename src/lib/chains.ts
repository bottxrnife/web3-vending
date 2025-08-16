import { sepolia, baseSepolia, type Chain } from "wagmi/chains";

export const SUPPORTED_CHAINS: Chain[] = [sepolia, baseSepolia];

export const DEFAULT_PRICE_USDC = Number(process.env.NEXT_PUBLIC_DEFAULT_PRICE_USDC ?? 0.75); 