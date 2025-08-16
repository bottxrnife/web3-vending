# Checkpoint 2 — Network Configuration

This checkpoint introduces network and application configuration needed for on-chain interactions and environment setup.

## Includes
- Everything from Checkpoint 1
- Network config: `src/lib/config.ts`, `src/lib/chains.ts`

## Why this step
- Centralizes chain IDs, RPCs, and app constants
- Prepares the codebase for wallet and contract integrations

## Quick check
- Review `src/lib/chains.ts` and `src/lib/config.ts` to confirm chain data and app constants are correct

### Hardware integration
- Subsequent checkpoints wire a generic webhook endpoint that your ESP32 can listen to for dispensing. You can alternatively integrate via MDB for standard vending machines. 