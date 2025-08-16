# Checkpoint 3 — Wallet Provider Integration

This checkpoint adds the wallet provider component to enable wallet connectivity and context throughout the app.

## Includes
- Everything from Checkpoint 2
- Wallet provider: `src/components/WalletProvider.tsx`

## Why this step
- Introduces shared wallet state and connectors in a dedicated component
- Lays the groundwork for any UI to access the connected account and network

## Quick check
- Inspect `src/components/WalletProvider.tsx` to verify configured chains/connectors
- Ensure the provider is imported where needed to wrap the app (e.g., layout)

### Hardware integration
- A generic webhook flow is added next. The ESP32 listens to the webhook to dispense the item. For vending machines, you can adapt the hardware layer to use the MDB protocol. 