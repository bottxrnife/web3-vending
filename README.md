# Omnichain Vending (Mobile Web)

A mobile-first web app to accept USDC on supported chains and complete a purchase after on-chain confirmation. Users can also fund via Coinbase Onramp (Apple Pay, etc.).

## Tech Stack
- Next.js + React + TypeScript
- Tailwind CSS
- Wagmi + viem (mobile wallet connect)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` in the project root and set:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_DEFAULT_PRICE_USDC=1
```

3. Configure payment routing in `src/lib/config.ts`:
- `usdcAddressByChainId`: token addresses per chain you support
- `oftOrComposerAddress`: your LayerZero OFT/Composer router on the source chain
- `destinationChainId`: target EVM chain ID for settlement

4. Run the dev server:
```bash
npm run dev
```

5. Open `http://localhost:3000` on your phone. Add to Home Screen for full-screen experience.

## Paying
- Connect with your mobile wallet (Injected/Coinbase/WalletConnect)
- Confirm approval + payment; the app shows a receipt on success
- Need crypto? Tap “Buy with Coinbase (Apple Pay)” to onramp

## Notes
- Replace `oftComposerAbi` and `oftOrComposerAddress` with your actual contract ABI/address and function parameters
- Customize supported chains in `src/lib/chains.ts`
- UI auto-resets to the welcome screen ~15s after receipt