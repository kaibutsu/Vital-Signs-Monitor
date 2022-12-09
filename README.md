# Vital-Signs-Monitor

*A virtual Vital Signs Monitor that runs in a web browser and can be controlled remotely via a peer-to-peer connection.*

This project is based on [Barry Robinson's Vital Signs Monitor](https://github.com/BarryRobinson/Vital-Signs-Monitor).

- [Vital-Signs-Monitor](#vital-signs-monitor)
  - [Usage](#usage)
  - [Features](#features)
  - [Issues](#issues)
  - [Credits](#credits)

## Usage

To run these files on your own server:

* Download `saVSMonitor.html`, `saVSControlWindow.html`, `saVSControlStyle.css`, `saVSMonitorStyle.css`, `pump.mp3`
* Place the `*.html` and `*.css` files in your directory with all of your other .html files.
* Create a new directory in this directory named `Sounds` (unless you already have a directory with that name). Put `pump.mp3` into the Sounds directory.

## Features

* Web-based: operates in any browser, very easy to use. Does not require downloading or installing any special software. Does not require admin privileges. Works with all collaboration software since it runs on its own in its own browser window.
* Lightweight: uses peer-to-peer communication (not through a server), minimal web traffic. See https://peerjs.com/ for details.
* Learner actions are time-stamped and logged in the Control Window for debriefing. The simulationist or the simulation operations specialist can add time-stamped comments as needed.
* Realistic: Learner operates the Vitals Monitor just like the real thing. Buttons are used to activate the various functions. When using the blood pressure function, the learner will hear the pump inflate the cuff and see the pressure go up, then drop at the standard rate (2mmHg/sec). Both blood pressure and MAP are displayed.
* Vital signs can be changed on-the-fly and can trend (change) over time. Vitals can be updated based on learner interventions.
* Vital signs monitor can be minimized or positioned where convenient on the learner’s screen. It can even be run on a separate device such as an iPad.
* Can use preprogrammed scenarios. The simulationist or the simulation operations specialist can preprogram sets of vitals in small text files that can be instantly sent to the monitor. The preprogrammed vitals can be tweaked, if necessary, before being sent. Start value, end value, delay and trend values can be loaded and sent.
* Simulationist window; mirrors control window. Time-stamped record of learner's actions. Aids in debriefing.
* Free. No charge.

## Issues

* [ ] ECG display
* [ ] Make Signal generation more generic
* [ ] Update [Usage](#usage)
* [ ] Add Sounds (mourning, Breathing, Crying)
* [ ] Add preprogrammable Scenarios to UI
* [ ] Add manual sync (id) option
* [ ] Move docs to Github Wiki
* [ ] Use [Reactive.js](https://ractive.js.org/)

## Credits

* [Smooth curve algorithm from Stack Overflow](https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas) by [Homan](https://stackoverflow.com/users/793454/homan).