export type Address = `0x${string}`;

export type PaymentConfig = {
	usdcAddressByChainId: Record<number, Address>;
	oftOrComposerAddress: Address; // Your OFT or Composer router contract address on source chain
	destinationChainId: number; // EVM chain ID for settlement (e.g., Base mainnet = 8453)
};

// NOTE: Replace these placeholder addresses with real ones for your deployment
export const paymentConfig: PaymentConfig = {
	usdcAddressByChainId: {
		1: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum mainnet USDC
		8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC
	},
	oftOrComposerAddress: "0x0000000000000000000000000000000000000000",
	destinationChainId: 8453,
}; 