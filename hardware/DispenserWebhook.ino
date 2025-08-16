#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <ESPmDNS.h>

// ===== WiFi Credentials =====
// TODO: Set your network credentials
const char* WIFI_SSID = "YourWifiName";
const char* WIFI_PASSWORD = "YourWifiPassword";

// ===== Servo Configuration =====
static const int SERVO_PIN = 26;           // GPIO pin for the servo signal
static const int HOME_POS_DEG = 0;         // Resting position
static const int DISPENSE_POS_DEG = 150;   // Position that dispenses the candy
static const int STEP_DEG = 10;            // Step size while sweeping
static const int STEP_DELAY_MS = 15;       // Delay between steps (controls speed)

// ===== HTTP Server =====
WebServer server(80);

Servo dispenserServo;
int currentPosDeg = HOME_POS_DEG;

void moveServoTo(int targetDeg) {
	if (targetDeg == currentPosDeg) return;
	int step = (targetDeg > currentPosDeg) ? STEP_DEG : -STEP_DEG;
	for (int pos = currentPosDeg; (step > 0) ? (pos <= targetDeg) : (pos >= targetDeg); pos += step) {
		dispenserServo.write(pos);
		delay(STEP_DELAY_MS);
	}
	currentPosDeg = targetDeg;
}

void dispenseOnce() {
	// Move to dispense position, then return home
	moveServoTo(DISPENSE_POS_DEG);
	// Brief hold to ensure the mechanism completes dispensing
	delay(200);
	moveServoTo(HOME_POS_DEG);
}

void handleRoot() {
	// Simple test page
	server.send(200, "text/html",
		"<html><body>"
		"<h2>ESP32 Dispenser</h2>"
		"<p>Click <a href=\"/dispense\">/dispense</a> to trigger.</p>"
		"</body></html>");
}

void handleDispense() {
	dispenseOnce();
	server.send(200, "application/json", "{\"status\":\"ok\",\"action\":\"dispense\"}");
}

void notFound() {
	server.send(404, "application/json", "{\"error\":\"not_found\"}");
}

void connectWiFi() {
	Serial.println();
	Serial.print("Connecting to ");
	Serial.println(WIFI_SSID);

	WiFi.mode(WIFI_STA);
	WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

	unsigned long startAttempt = millis();
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		Serial.print(".");
		if (millis() - startAttempt > 30000) {
			Serial.println("\nWiFi connect timeout. Restarting...");
			esp_restart();
		}
	}

	Serial.println("\nWiFi connected.");
	Serial.print("IP address: ");
	Serial.println(WiFi.localIP());
}

void setupMDNS() {
	if (MDNS.begin("esp32-dispenser")) {
		Serial.println("mDNS responder started: http://esp32-dispenser.local/");
	} else {
		Serial.println("Error setting up mDNS responder!");
	}
}

void setup() {
	Serial.begin(115200);

	// Servo setup
	ESP32PWM::allocateTimer(0);
	ESP32PWM::allocateTimer(1);
	ESP32PWM::allocateTimer(2);
	ESP32PWM::allocateTimer(3);
	dispenserServo.setPeriodHertz(50);
	dispenserServo.attach(SERVO_PIN, 1000, 2000);
	dispenserServo.write(HOME_POS_DEG);
	currentPosDeg = HOME_POS_DEG;

	// WiFi and mDNS
	connectWiFi();
	setupMDNS();

	// HTTP routes
	server.on("/", HTTP_GET, handleRoot);
	server.on("/dispense", HTTP_GET, handleDispense);
	server.on("/dispense", HTTP_POST, handleDispense);
	server.onNotFound(notFound);
	server.begin();
	Serial.println("HTTP server started");
	Serial.println("Set DISPENSER_WEBHOOK_URL to http://<ESP32_IP>/dispense or http://esp32-dispenser.local/dispense");
}

void loop() {
	server.handleClient();
} 