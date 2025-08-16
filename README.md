# Checkpoint 5 — StepFlow UI and Hardware

This checkpoint completes the flow with the interactive StepFlow UI and includes the ESP32 firmware directory.

## Includes
- Everything from Checkpoint 4
- UI flow: `src/components/StepFlow.tsx`
- Hardware: `esp32_code/`

## Why this step
- Delivers the end-to-end user journey in the UI
- Pairs on-chain actions with the embedded hardware component

## Quick check
- Open the app and navigate to the UI that uses `StepFlow.tsx`
- Review `esp32_code/` for firmware and upload instructions

### Hardware integration
- After on-chain confirmation, the app posts to `/api/webhook`, which forwards to your `DISPENSER_WEBHOOK_URL`. The ESP32 listens for this webhook and dispenses the item. You can alternatively integrate with vending machines using the MDB protocol. 