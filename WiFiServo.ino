#include <ESP8266WiFi.h>
#include <Servo.h>

const char* ssid = "your-network";
const char* password = "your-password";
const int off_State = -35;
const int on_State = 35;

// Create an instance of the server
// specify the port to listen on as an argument
WiFiServer server(80);

// Create Servo instance
Servo servo;

void setup() {
  Serial.begin(115200);
  delay(10);

  servo.attach(2);          //D4
  servo.write(off_State);   // Put servo on OFF state
  
  // Connect to WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  
  // Start the server
  server.begin();
  Serial.println("Server started");

  // Print the IP address
  Serial.println(WiFi.localIP());
}

void loop() {
  // Check if a client has connected
  WiFiClient client = server.available();
  if (!client) {
    return;
  }
  
  // Wait until the client sends some data
  Serial.println("new client");
  while(!client.available()){
    delay(1);
  }
  
  // Read the first line of the request
  String req = client.readStringUntil('\r');
  Serial.println(req);
  client.flush();
  
  // Match the request
  String result = "";
  
  if (req.indexOf("/switch/0") != -1) {
    servo.write(off_State);
    result = "off";
  }
  else if (req.indexOf("/switch/1") != -1) {
    servo.write(on_State);
    result = "on";
  }
  else if (req.indexOf("/switch/status") != -1) {
    result = servo.read() == on_State ? "1" : "0";
  }
  else {
    Serial.println("invalid request");
    client.stop();
    return;
  }
  
  client.flush();

  // Prepare the response
  String s = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + result;

  // Send the response to the client
  client.print(s);
  delay(1);
  Serial.println("Client disconnected");

  // The client will actually be disconnected 
  // when the function returns and 'client' object is detroyed
}

