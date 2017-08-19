var exec = require("child_process").exec;
var Accessory, Service, Characteristic, UUIDGen;
var PythonShell = require('python-shell');

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-servo-switch", "ServoSwitch", ServoSwitch, true);
}

function ServoSwitch(log, config, api) {
  this.log = log;
  this.config = config || {"platform": "ServoSwitch"};
  this.switches = this.config.switches || [];

  this.accessories = {};

  if (api) {
    this.api = api;
    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  }
}

// Method to restore accessories from cache
ServoSwitch.prototype.configureAccessory = function (accessory) {
  this.setService(accessory);
  this.accessories[accessory.context.name] = accessory;
}

// Method to setup accesories from config.json
ServoSwitch.prototype.didFinishLaunching = function () {
  // Add or update accessories defined in config.json
  for (var i in this.switches) this.addAccessory(this.switches[i]);

  // Remove extra accessories in cache
  for (var name in this.accessories) {
    var accessory = this.accessories[name];
    if (!accessory.reachable) this.removeAccessory(accessory);
  }
}

// Method to add and update HomeKit accessories
ServoSwitch.prototype.addAccessory = function (data) {
  this.log("Initializing platform accessory '" + data.name + "'...");

  // Retrieve accessory from cache
  var accessory = this.accessories[data.name];

  if (!accessory) {
    // Setup accessory as SWITCH (8) category.
    var uuid = UUIDGen.generate(data.name);
    accessory = new Accessory(data.name, uuid, 8);

    // Setup HomeKit switch service
    accessory.addService(Service.Switch, data.name);

    // New accessory is always reachable
    accessory.reachable = true;

    // Setup listeners for different switch events
    this.setService(accessory);

    // Register new accessory in HomeKit
    this.api.registerPlatformAccessories("homebridge-servo-switch", "ServoSwitch", [accessory]);

    // Store accessory in cache
    this.accessories[data.name] = accessory;
  }

  // Store and initialize variables into context
  var cache = accessory.context;
  cache.name = data.name;
  cache.gpioPin = data.gpioPin;
  cache.onPulse = data.onPulse;
  cache.offPulse = data.offPulse;
  
  if (cache.state === undefined) {
    cache.state = false;
  }

  // Retrieve initial state
  this.getInitState(accessory);
}

// Method to remove accessories from HomeKit
ServoSwitch.prototype.removeAccessory = function (accessory) {
  if (accessory) {
    var name = accessory.context.name;
    this.log(name + " is removed from HomeBridge.");
    this.api.unregisterPlatformAccessories("homebridge-servo-switch", "ServoSwitch", [accessory]);
    delete this.accessories[name];
  }
}

// Method to setup listeners for different events
ServoSwitch.prototype.setService = function (accessory) {
  accessory.getService(Service.Switch)
    .getCharacteristic(Characteristic.On)
    .on('set', this.setPowerState.bind(this, accessory.context));

  accessory.on('identify', this.identify.bind(this, accessory.context));
}

// Method to retrieve initial state
ServoSwitch.prototype.getInitState = function (accessory) {
  // Configured accessory is reachable
  accessory.updateReachability(true);
}

// Method to set state
ServoSwitch.prototype.setPowerState = function (thisSwitch, state, callback) {
  console.log("Path: " + __dirname);

  var self = this;

  var tout = null;

  self.log("That's the state: " + state);

  PythonShell.defaultOptions = {
    scriptPath: __dirname + '/python-scripts',
  };

  var options;

  if (state) {
    options = {
      args: [thisSwitch.gpioPin, thisSwitch.onPulse]
    }
  }
  else {
    options = {
      args: [thisSwitch.gpioPin, thisSwitch.offPulse]
    }
  }

  PythonShell.run('python.py', options, function (err, results) {
    if (err) {
      console.log(err);
      throw err;
    }

    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
  });

  // Execute command to set state
  exec(function (error, stdout, stderr) {
    // Error detection
    if (error && (state !== thisSwitch.state)) {
      self.log("Failed to turn " + (state ? "on " : "off ") + thisSwitch.name);
      self.log(stderr);
    } else {
      thisSwitch.state = state;
      error = null;
    }
  });

  // Allow 1s to set state but otherwise assumes success
  tout = setTimeout(function () {
    tout = null;
    self.log("Turning " + (state ? "on " : "off ") + thisSwitch.name + " took too long [7500s], assuming success." );
    callback();
  }, 7500);
}

// Method to handle identify request
ServoSwitch.prototype.identify = function (thisSwitch, paired, callback) {
  this.log(thisSwitch.name + " identify requested!");
  callback();
}

// Method to handle plugin configuration in HomeKit app
ServoSwitch.prototype.configurationRequestHandler = function (context, request, callback) {
  if (request && request.type === "Terminate") {
    return;
  }

  // Instruction
  if (!context.step) {
    var instructionResp = {
      "type": "Interface",
      "interface": "instruction",
      "title": "Before You Start...",
      "detail": "Please make sure homebridge is running with elevated privileges.",
      "showNextButton": true
    }

    context.step = 1;
    callback(instructionResp);
  } else {
    switch (context.step) {
      case 1:
        // Operation choices
        var respDict = {
          "type": "Interface",
          "interface": "list",
          "title": "What do you want to do?",
          "items": [
            "Add New Switch",
            "Modify Existing Switch",
            "Remove Existing Switch"
          ]
        }

        context.step = 2;
        callback(respDict);
        break;
      case 2:
        var selection = request.response.selections[0];
        if (selection === 0) {
          // Info for new accessory
          var respDict = {
            "type": "Interface",
            "interface": "input",
            "title": "New Switch",
            "items": [{
              "id": "name",
              "title": "Name (Required)",
              "placeholder": "Switch"
            }]
          };

          context.operation = 0;
          context.step = 3;
          callback(respDict);
        } else {
          var names = Object.keys(this.accessories);

          if (names.length > 0) {
            // Select existing accessory for modification or removal
            if (selection === 1) {
              var title = "Witch switch do you want to modify?";
              context.operation = 1;
              context.step = 3;
            } else {
              var title = "Witch switch do you want to remove?";
              context.step = 5;
            }

            var respDict = {
              "type": "Interface",
              "interface": "list",
              "title": title,
              "items": names
            };

            context.list = names;
          } else {
            // Error if not switch is configured
            var respDict = {
              "type": "Interface",
              "interface": "instruction",
              "title": "Unavailable",
              "detail": "No switch is configured.",
              "showNextButton": true
            };

            context.step = 1;
          }
          callback(respDict);
        }
        break;
      case 3:
        if (context.operation === 0) {
          var data = request.response.inputs;
        } else if (context.operation === 1) {
          var selection = context.list[request.response.selections[0]];
          var data = this.accessories[selection].context;
        }
        
        if (data.name) {
          // Add/Modify info of selected accessory
          var respDict = {
            "type": "Interface",
            "interface": "input",
            "title": data.name,
            "items": [
            {
              "id": "gpioPin",
              "title": "Pin which the servo is attached on GPIO",
              "Placeholder": "40"
            },
            {
              "id": "onPulse",
              "title": "Pulse on the servo to determine on state",
              "Placeholder": "5.7"
            },
            {
              "id": "offPulse",
              "title": "Pulse on the servo to determine off state",
              "Placeholder": "8.3"
            }]
          };

          context.name = data.name;
          context.step = 4;
        } else {
          // Error if required info is missing
          var respDict = {
            "type": "Interface",
            "interface": "instruction",
            "title": "Error",
            "detail": "Name of the switch is missing.",
            "showNextButton": true
          };
        
          context.step = 1;
        }

        delete context.list;
        delete context.operation;
        callback(respDict);
        break;
      case 4:
        var userInputs = request.response.inputs;
        var newSwitch = {};

        // Clone context if switch exists
        if (this.accessories[context.name]) {
          newSwitch = JSON.parse(JSON.stringify(this.accessories[context.name].context));
        }

        // Setup input for addAccessory
        newSwitch.name = context.name;
        newSwitch.gpioPin = userInputs.gpioPin || newSwitch.gpioPin;
        newSwitch.onPulse = userInputs.onPulse || newSwitch.onPulse;
        newSwitch.offPulse = userInputs.offPulse || newSwitch.offPulse;

        // Register or update accessory in HomeKit
        this.addAccessory(newSwitch);
        var respDict = {
          "type": "Interface",
          "interface": "instruction",
          "title": "Success",
          "detail": "The new switch is now updated.",
          "showNextButton": true
        };

        context.step = 6;
        callback(respDict);
        break;
      case 5:
        // Remove selected accessory from HomeKit
        var selection = context.list[request.response.selections[0]];
        var accessory = this.accessories[selection];

        this.removeAccessory(accessory);
        var respDict = {
          "type": "Interface",
          "interface": "instruction",
          "title": "Success",
          "detail": "The switch is now removed.",
          "showNextButton": true
        };

        delete context.list;
        context.step = 6;
        callback(respDict);
        break;
      case 6:
        // Update config.json accordingly
        var self = this;
        delete context.step;
        var newConfig = this.config;

        // Create config for each switch
        var newSwitches = Object.keys(this.accessories).map(function (k) {
          var accessory = self.accessories[k];
          var data = {
            'name': accessory.context.name,
            'gpioPin': accessory.context.gpioPin,
            'onPulse': accessory.context.onPulse,
            'offPulse': accessory.context.offPulse
          };
          return data;
        });

        newConfig.switches = newSwitches;
        callback(null, "platform", true, newConfig);
        break;
    }
  }
}
