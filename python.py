import sys

# simple argument echo script
# for v in sys.argv[1:]:
#   print v

import RPi.GPIO as GPIO
import time

gpioPin = int(sys.argv[1])
onPulse = float(sys.argv[2])

# Disable GPIO warnings
GPIO.setwarnings(False)

# Use BOARd GPIO references
# instead of physical pin numbers
GPIO.setmode(GPIO.BOARD)

# Setup pins
GPIO.setup(gpioPin, GPIO.OUT)

pwm = GPIO.PWM(gpioPin,50)
pwm.start(onPulse)
time.sleep(1)

GPIO.cleanup();