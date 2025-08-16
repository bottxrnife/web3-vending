export type Address = `0x${string}`;

export type PaymentConfig = {
	usdcAddressByChainId: Record<number, Address>;
	oftOrComposerAddress: Address; // Your OFT or Composer router contract address on source chain
	destinationChainId: number; // EVM chain ID for settlement (e.g., Base Sepolia = 84532)
};

// NOTE: Replace these placeholder addresses with real ones for your deployment
export const paymentConfig: PaymentConfig = {
	usdcAddressByChainId: {
		11155111: "0x9229c70d0388213894ddAFB0edf6fE38090F2FcC", // Sepolia USDC (test address provided)
		84532: "0x9229c70d0388213894ddAFB0edf6fE38090F2FcC", // Base Sepolia USDC (test address provided)
	},
	oftOrComposerAddress: "0x0000000000000000000000000000000000000000",
	destinationChainId: 84532,
};

export const IFTTT_WEBHOOK_URL = process.env.IFTTT_WEBHOOK_URL || ""; // PLACE YOUR IFTTT WEBHOOK URL IN .env.local 