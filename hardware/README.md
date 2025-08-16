# ESP32 Dispenser Webhook

This firmware exposes an HTTP endpoint that triggers a servo to move to the candy dispense position and back. Point your app's webhook to the ESP32 and it will dispense on request.

## Sketch
- `DispenserWebhook.ino`: HTTP server with `/dispense` endpoint (GET/POST). Moves the servo to 150° and back to 0°.
- Reference: `AdjustmentHelp.ino` helps determine correct angles; `SimpleDispenser.ino` demonstrates manual trigger.

## Hardware
- Board: ESP32 DevKit (or compatible)
- Servo signal pin: GPIO 26 (default)
- Power: Use an external 5V supply for the servo; connect grounds together with ESP32 GND.

## Libraries
- ESP32 Board Package (via Arduino Boards Manager)
- `ESP32Servo` by Kevin Harrington
- `ESPmDNS` (included with ESP32 core)
- `WebServer` (included with ESP32 core)

## Configure
1. Open `DispenserWebhook.ino`.
2. Set WiFi credentials:
   - `WIFI_SSID`
   - `WIFI_PASSWORD`
3. Optional: adjust:
   - `SERVO_PIN` (default 26)
   - `DISPENSE_POS_DEG` (default 150)
   - `HOME_POS_DEG` (default 0)

## Upload
1. Select your ESP32 board and the correct port in Arduino IDE.
2. Upload `DispenserWebhook.ino`.
3. Open Serial Monitor (115200 baud) to see the assigned IP.

## Test
- Browser: open `http://<ESP32_IP>/` and click `/dispense`, or send `GET/POST` to `http://<ESP32_IP>/dispense`.
- mDNS: try `http://esp32-dispenser.local/dispense`.

## Integrate with the web app
- Set `DISPENSER_WEBHOOK_URL` to the ESP32 endpoint, e.g.:
  - `DISPENSER_WEBHOOK_URL=http://<ESP32_IP>/dispense`
  - or `DISPENSER_WEBHOOK_URL=http://esp32-dispenser.local/dispense`

## Notes
- Adjust angles using `AdjustmentHelp.ino` if your mechanical setup differs.
- Consider debouncing or adding a short delay between dispense requests if you expect rapid triggers.
- For vending machines: you can adapt the hardware layer to speak MDB protocol instead of driving a hobby servo. 