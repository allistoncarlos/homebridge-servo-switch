# Homebridge Servo Switch
Control a Servo Motor through Homebridge as a switch. Designed to use with RaspberryPi and [Homebridge](https://github.com/nfarina/homebridge/), it helps to transform a dumb lightswitch to a smart one. 
Depends on [python-shell](https://github.com/extrabacon/python-shell) package.

![](https://media.giphy.com/media/l3fzJbaGUsvmGRffG/giphy.gif)

### Installation
```sh
$ sudo npm install -g homebridge-servo-switch
```

### Configuration
```
{
    "platforms": [{
          "platform" : "ServoSwitch",
          "name" : "Servo Switch",
          "switches": [{
            "name" : "Light",
            "gpioPin" : 40,
            "onPulse" : 5.7,
            "offPulse" : 8.3
        }]
    }]
```

### Where
- **name** is the name of your choice
- **gpioPin** is the pin that the servo motor is connected
- **onPulse** is the ammount of degrees to turn the servo for a "On" state *
- **offPulse** is the ammount of degrees to turn the servo for a "Off" state *
 > The period is based on 20 ms (50 Hz) 

### Using Servo Motor with NodeMCU
I've uploaded a [INO file](https://github.com/allistoncarlos/homebridge-servo-switch/blob/master/WiFiServo.ino) to be used with NodeMCU. It creates a HTTP Server that allows Homebridge to connect and control, through [Homebridge HTTP Plugin](https://github.com/rudders/homebridge-http). I'm using D4, 3v and GND pins to connect the Servo on NodeMCU.

Follows the config.json to configure it EXCLUSIVELY when using NodeMCU

```json
{
    "accessory": "HTTP-RGB",
    "name": "Light Test",

    "switch": {
        "status": "http://<YOUR_IP>/switch/status",
        "powerOn": "http://<YOUR_IP>/switch/1",
        "powerOff": "http://<YOUR_IP>/switch/0"
    }
}
```

### Doubts, suggestions and bugs
Please feel free to report at [Issues](https://github.com/allistoncarlos/homebridge-servo-switch/issues) page