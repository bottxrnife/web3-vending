# Checkpoint 4 — API Route and Contract ABIs

This checkpoint adds a serverless API route and the contract ABIs required for on-chain interactions.

## Includes
- Everything from Checkpoint 3
- API route: `src/app/api/webhook/route.ts`
- Contract ABIs: `src/lib/oftAbi.ts`, `src/lib/usdcAbi.ts`

## Why this step
- Introduces backend functionality (webhook endpoint) for integrations
- Centralizes ABI artifacts for consistent contract interaction

## Quick check
- Run `npm run dev` and test the API at `/api/webhook` (method per implementation)
- Confirm ABIs export the expected fragments

### Hardware integration
- The server forwards to a generic webhook URL. The ESP32 listens for this webhook and dispenses the item. This can be adapted to vending machines via the MDB protocol. 