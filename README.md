# Omnichain Vending Kiosk (Frontend)

A kiosk-style web app to accept USDC on any supported chain and trigger a physical candy dispenser via IFTTT after on-chain confirmation.

## Tech Stack
- Next.js + React + TypeScript
- Tailwind CSS
- Wagmi + RainbowKit + viem (WalletConnect QR for kiosk)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` in the project root and set:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_DEFAULT_PRICE_USDC=1
IFTTT_WEBHOOK_URL=https://maker.ifttt.com/trigger/YOUR_EVENT/with/key/YOUR_KEY
```

3. Configure the payment routing in `src/lib/config.ts`:
- `usdcAddressByChainId`: USDC token addresses per chain you support
- `oftOrComposerAddress`: Your LayerZero OFT/Composer router on the source chain
- `destinationChainId`: The target EVM chain ID for settlement (e.g., Base = 8453)

4. Run the dev server:
```bash
npm run dev
```

5. Open `http://localhost:3000` on your kiosk device (iPad). Add to Home Screen for full-screen experience.

## IFTTT Webhook Placement
Place your IFTTT webhook URL in `.env.local` as `IFTTT_WEBHOOK_URL`. The app calls `/api/ifttt` after a successful on-chain confirmation, which forwards to your IFTTT URL. Your Raspberry Pi should listen to that IFTTT event and spin the motor.

## Notes
- Replace `oftComposerAbi` and `oftOrComposerAddress` with your actual Composer or OFT contract ABI and address. Call parameters may differ.
- You can customize supported chains in `src/lib/chains.ts`.
- The UI auto-resets to the welcome screen ~15s after receipt. 