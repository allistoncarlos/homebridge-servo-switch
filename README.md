# Homebridge Servo Switch
Control a Servo Motor through Homebridge as a switch. Designed to use with RaspberryPi and [Homebridge](https://github.com/nfarina/homebridge/), it helps to transform a dumb lightswitch to a smart one. 
Depends on [python-shell](https://github.com/extrabacon/python-shell) package.

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

### Doubts, suggestions and bugs
Please feel free to report at [Issues](https://github.com/allistoncarlos/homebridge-servo-switch/issues) page