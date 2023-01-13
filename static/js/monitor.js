const intstamp = Date.now();
let bpSound;
let lastPeerId = null;
let peer = null;
let conn = null;

let ecgn = false;
let ecgSig = 'nsr';
let ecgSig2 = 'nsr';
let ecgTrend = 0;

let systol = 120;
let diastl = 80;
let systol2 = 0;
let diastl2 = 0;
let bpDelay = 0;
let bpTrend = 0;

let oximet = 100;
let oximet2 = 0;
let oxDelay = 0;
let oxTrend = 0;
let poxMin = 21; // minimum value in SpO2 required for reading, otherwise low

let heartr = 72;
let heartr2 = 0;
let hrDelay = 0;
let hrTrend = 0;

let temper = 37.0;
let temper2 = 0;
let tpDelay = 0;
let tpTrend = 0;

let respir = 14;
let respir2 = 0;
let rrDelay = 0;
let rrTrend = 0;

let celsius = true;
let poON = false;
let wrkg = false;
let notSent = true;
let toggle = true;

function initialize() {
     peer = new Peer(null, { debug: 2 });
     peer.on('open', function (id) {
          if (peer.id === null) peer.id = lastPeerId;
          else lastPeerId = peer.id;
     });

     peer.on('connection', function (c) {
          c.on('open', function () {
               c.send("Sender does not accept incoming connections");
               setTimeout(function () { c.close(); }, 500);
          });
     });

     peer.on('disconnected', function () {
          isconnect.innerHTML = "Connection lost. Please reconnect";
          peer.id = lastPeerId;
          peer._lastServerId = lastPeerId;
          peer.reconnect();
     });

     peer.on('close', function () {
          conn = null;
          isconnect.innerHTML = "Connection destroyed. Please refresh";
     });
     peer.on('error', function (err) { isconnect.innerHTML = '' + err; });
}

function conectToPeer() {
     let pid = getUrlParam("id");
     if (pid == null || pid == "") {
          isconnect.innerHTML = "running in stand-alone mode";
          hideLoginBox();
          return;
     }
     isconnect.innerHTML = "connecting with " + pid;

     setTimeout(function () {
          if (conn) conn.close();
          conn = peer.connect(pid, { reliable: true });

          conn.on('open', function () {
               isconnect.innerHTML = "Connected to " + conn.peer;
               if (conn && conn.open) {
                    hideLoginBox();
                    conn.send('clock=' + intstamp);
               }
          });
          conn.on('data', function (data) { processVitals(data); });
          conn.on('close', function () { isconnect.innerHTML = "Connection closed"; });
     }, 5000);
}

function getUrlParam(name) {
     name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
     let regexS = "[\\?&]" + name + "=([^&#]*)";
     let regex = new RegExp(regexS);
     let results = regex.exec(window.location.href);
     if (results == null) return null;
     else return results[1];
}

function hideLoginBox() {
     for (id in ['log1', 'log2', 'log3']) {
          document.getElementById(id).style.display = 'none';
          document.getElementById(id).style.zIndex = '0';
     }
}

function setPatientData() {
     if (arguments.length === 2) {
          pt1.innerHTML = arguments[0] + arguments[1];
     }
     if (arguments.length === 4) {
          pt1.innerHTML = arguments[0] + arguments[1];
          pt2.innerHTML = arguments[2] + arguments[3];
     }
     if (arguments.length === 6) {
          pt1.innerHTML = arguments[0] + arguments[1];
          pt2.innerHTML = arguments[2] + arguments[3];
          pt3.innerHTML = arguments[4] + arguments[5];
     }
}

function setECG() {
     if (arguments.length == 1) {
          if (arguments[0] === true || arguments[0] === 'true') showECG();
          else hideECG();
          ecgSig = 'nsr';
          ecgSig2 = 'nsr';
          ecgTrend = 0;
     }
     if (arguments.length == 2) {
          if (arguments[0] === true || arguments[0] === 'true') showECG();
          else hideECG();
          ecgSig = arguments[1];
          ecgSig2 = 'nsr';
          ecgTrend = 0;
     }
     if (arguments.length == 4) {
          if (arguments[0] === true || arguments[0] === 'true') showECG();
          else hideECG();
          ecgSig = arguments[1];
          ecgSig2 = arguments[2];
          ecgTrend = (Number(arguments[3]) * 1000) + Date.now();
     }
}

function setBloodPressure() {
     if (arguments.length == 2) {
          systol = Number(arguments[0]);
          diastl = Number(arguments[1]);
          systol2 = 0;
          diastl2 = 0;
          bpDelay = 0;
          bpTrend = 0;
     }
     if (arguments.length == 6) {
          systol = Number(arguments[0]);
          diastl = Number(arguments[1]);
          systol2 = Number(arguments[2]);
          diastl2 = Number(arguments[3]);
          bpDelay = (Number(arguments[4]) * 1000) + Date.now();
          bpTrend = (Number(arguments[5]) * 1000) + bpDelay;
     }
}

function setTemperature() {
     if (arguments.length == 2) {
          checkCF(arguments[0]);
          temper = Number(arguments[1]);
          temper2 = 0;
          tpDelay = 0;
          tpTrend = 0;
     }
     if (arguments.length == 5) {
          checkCF(arguments[0]);
          temper = Number(arguments[1]);
          temper2 = Number(arguments[2]);
          tpDelay = (Number(arguments[3]) * 1000) + Date.now();
          tpTrend = (Number(arguments[4]) * 1000) + tpDelay;
     }
}

function setRespirationRate() {
     if (arguments.length == 1) {
          respir = Number(arguments[0]);
          respir2 = 0;
          rrDelay = 0;
          rrTrend = 0;
     }
     if (arguments.length == 4) {
          respir = Number(arguments[0]);
          respir2 = Number(arguments[1]);
          rrDelay = (Number(arguments[2]) * 1000) + Date.now();
          rrTrend = (Number(arguments[3]) * 1000) + rrDelay;
     }
}

function setHeartRate() {
     if (arguments.length == 1) {
          heartr = Number(arguments[0]);
          heartr2 = 0;
          hrDelay = 0;
          hrTrend = 0;
     }
     if (arguments.length == 4) {
          heartr = Number(arguments[0]);
          heartr2 = Number(arguments[1]);
          hrDelay = (Number(arguments[2]) * 1000) + Date.now();
          hrTrend = (Number(arguments[3]) * 1000) + hrDelay;
     }
}

function setPulseOximetry() {
     if (arguments.length == 1) {
          oximet = Number(arguments[0]);
          oximet2 = 0;
          oxDelay = 0;
          oxTrend = 0;
     }
     if (arguments.length == 4) {
          oximet = Number(arguments[0]);
          oximet2 = Number(arguments[1]);
          oxDelay = (Number(arguments[2]) * 1000) + Date.now();
          oxTrend = (Number(arguments[3]) * 1000) + oxDelay;
     }
}

function processVitals(dataString) {
     dataString = decodeURI(dataString);
     if (dataString.charAt(0) == '?') {
          dataString = dataString.substr(1);
          let keyValPairs = dataString.split('&');
          stepKeyValPairs(keyValPairs);
     }
}

function stepKeyValPairs(kvparry) {
     let currTime = Date.now();
     let keyvalue;
     for (let idx = 0; idx < kvparry.length; idx++) {
          keyvalue = kvparry[idx].split('=');
          switch (keyvalue[0]) {
               case 'pt01':
                    pt1.innerHTML = keyvalue[1];
                    break;
               case 'pt02':
                    pt2.innerHTML = keyvalue[1];
                    break;
               case 'pt03':
                    pt3.innerHTML = keyvalue[1];
                    break;
               case 'ecgn':
                    if (keyvalue[1] === 'true' || keyvalue[1] === true) showECG();
                    else hideECG();
                    break;
               case 'ecgs':
                    ecgSig = keyvalue[1];
                    break;
               case 'ecge':
                    ecgSig2 = keyvalue[1];
                    break;
               case 'ecgt':
                    ecgTrend = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'syss':
                    systol = Number(keyvalue[1]);
                    break;
               case 'syse':
                    systol2 = Number(keyvalue[1]);
                    break;
               case 'sysd':
                    bpDelay = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'syst':
                    bpTrend = (Number(keyvalue[1]) * 1000) + bpDelay;
                    break;
               case 'dias':
                    diastl = Number(keyvalue[1]);
                    break;
               case 'diae':
                    diastl2 = Number(keyvalue[1]);
                    break;
               case 'spos':
                    oximet = Number(keyvalue[1]);
                    if (poON && conn && conn.open) {
                         conn.send('Pulse oximeter probe still applied SpO2: ' + oximet + '%');
                         notSent = false;
                    }
                    break;
               case 'spoe':
                    oximet2 = Number(keyvalue[1]);
                    break;
               case 'spod':
                    oxDelay = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'spot':
                    oxTrend = (Number(keyvalue[1]) * 1000) + oxDelay;
                    break;
               case 'plss':
                    heartr = Number(keyvalue[1]);
                    if (poON && conn && conn.open) {
                         conn.send('Pulse oximeter probe still applied Pulse: ' + heartr);
                         notSent = false;
                    }
                    break;
               case 'plse':
                    heartr2 = Number(keyvalue[1]);
                    break;
               case 'plsd':
                    hrDelay = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'plst':
                    hrTrend = (Number(keyvalue[1]) * 1000) + hrDelay;
                    break;
               case 'tmps':
                    temper = Number(keyvalue[1]);
                    break;
               case 'tmpe':
                    temper2 = Number(keyvalue[1]);
                    break;
               case 'tmpd':
                    tpDelay = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'tmpt':
                    tpTrend = (Number(keyvalue[1]) * 1000) + tpDelay;
                    break;
               case 'cels':
                    checkCF(keyvalue[1]);
                    break;
               case 'rsps':
                    respir = Number(keyvalue[1]);
                    break;
               case 'rspe':
                    respir2 = Number(keyvalue[1]);
                    break;
               case 'rspd':
                    rrDelay = (Number(keyvalue[1]) * 1000) + currTime;
                    break;
               case 'rspt':
                    rrTrend = (Number(keyvalue[1]) * 1000) + rrDelay;
                    break;
          }
     }
}

function currentValue(svalue, evalue, delay, trend) {
     let ctime = Date.now();
     let cvalue;
     if (ctime > delay && ctime < trend)
          cvalue = ((ctime - delay) / (trend - delay) * (evalue - svalue)) + svalue;
     else if (ctime > trend && delay < trend) cvalue = evalue;
     else cvalue = svalue;
     return cvalue;
}

function checkCF(boolCF) {
     if (boolCF === true || boolCF === 'true') {
          if (!celsius) tempCF.innerHTML = "---.-";
          celsius = true;
          cf.innerHTML = "&deg;C";
     }
     else {
          if (celsius) tempCF.innerHTML = "---.-";
          celsius = false;
          cf.innerHTML = "&deg;F";
     }
}

function hideECG() {
     let elem = document.getElementById('divECG');
     elem.style.display = 'none';
     elem = document.getElementById('buttonECG');
     elem.style.display = 'none';
     ecgn = false;
}

function showECG() {
     let elem = document.getElementById('divECG');
     elem.style.display = 'flex';
     elem = document.getElementById('buttonECG');
     elem.style.display = 'inline-block';
     ecgn = true;
}

function runECG() {
     // code for ECG runs from here
     if (conn && conn.open) conn.send('ECG started: ' + ecgSig);
}

function dispBP(target1, target2, target3) {
     let sysT = Math.round(currentValue(systol, systol2, bpDelay, bpTrend));
     let diaS = Math.round(currentValue(diastl, diastl2, bpDelay, bpTrend));
     let timeInt = 533;
     let infMSec = 6000;
     if (diaS > sysT && !wrkg) {
          target1.innerHTML = 'Err';
          target2.innerHTML = 'Err';
          target3.innerHTML = 'Err';
     }
     else if (!wrkg) {
          wrkg = true;
          let upper = sysT + 10;
          let lower = diaS - 10;
          if (lower < 4) lower = 4;
          target1.innerHTML = "-- /";
          target2.innerHTML = " --";
          target3.innerHTML = "--"
          let infCount = 0;
          let infPress = 0;
          let cycles = infMSec / timeInt;
          let infCycleP = Math.floor(upper / cycles);
          cycles = cycles + 2;
          playSound(bpSound);
          let x = setInterval(function () {
               if (cycles > infCount++) {
                    if (infPress < 100) target1.innerHTML = " " + infPress + " /";
                    else target1.innerHTML = infPress + " /";
                    if (infPress < upper) infPress = infPress + infCycleP;
               }
               else {
                    if (upper > lower) {
                         if (upper < 100) target1.innerHTML = " " + upper + " /";
                         else target1.innerHTML = upper + " /";
                         upper = upper - Math.floor(Math.random() * 4);
                    }
                    else {
                         if (sysT < 100) target1.innerHTML = " " + sysT + " /";
                         else target1.innerHTML = sysT + " /";
                         target2.innerHTML = " " + diaS;
                         wrkg = false;
                         let mean = Math.floor(((2 * diaS) + sysT) / 3);
                         target3.innerHTML = mean;
                         if (conn && conn.open) conn.send('Blood pressure taken ' + sysT + ' / ' + diaS + ' MAP ( ' + mean + ' )');
                         clearInterval(x);
                    }
               }
          }, timeInt);
     }
}

function dispPO(target1, target2) {
     let count = 0;
     let poX = 0;
     let poXr = 0;
     let poXp = 0;
     let htR = Math.round(currentValue(heartr, heartr2, hrDelay, hrTrend));
     if (!toggle) toggle = true;
     else toggle = false;
     if (!poON) {
          poON = true;
          let pulse = Math.floor(8572 / htR);
          let inter = Math.floor(htR * 7 / 5);
          let n = setInterval(function () {
               if (inter > 0) {
                    if (inter % 4 == 0) {
                         target1.innerHTML = "-   ";
                         target2.innerHTML = "-   ";
                    }
                    if (inter % 4 == 1) {
                         target1.innerHTML = "-- ";
                         target2.innerHTML = "-- ";
                    }
                    if (inter % 4 == 2) {
                         target1.innerHTML = "-   ";
                         target2.innerHTML = "-   ";
                    }
                    if (inter % 4 == 3) {
                         target1.innerHTML = "    ";
                         target2.innerHTML = "    ";
                    }
                    inter--;
               }
               else {
                    poX = Math.round(currentValue(oximet, oximet2, oxDelay, oxTrend));
                    target2.innerHTML = Math.round(currentValue(heartr, heartr2, hrDelay, hrTrend));
                    if (count++ > htR || notSent) {
                         poXr = poX;
                         if (poXr < 80) poXr = Math.round(poXr + (Math.random() * 4.00) - 1.99);
                         else poXr = Math.round(poXr + (Math.random() * 2.00) - 0.99);
                         if (poXr > 100) poXr = 100;
                         if (poXr < poxMin) target1.innerHTML = "low";
                         else target1.innerHTML = poXr;
                         count = 0;
                    }
                    else if (poX != poXp) {
                         if (poX < poxMin) target1.innerHTML = "low";
                         else target1.innerHTML = poX;
                         poXp = poX;
                    }
                    if (notSent) {
                         let poXx = poX;
                         if (poX < poxMin) poXx = "low";
                         if (conn && conn.open) conn.send('Pulse oximeter probe applied SpO2: '
                              + poXx + '% Pulse: ' + htR);
                         notSent = false;
                    }
               }
               if (toggle) {
                    clearInterval(n);
                    poON = false;
                    notSent = true;
                    if (conn && conn.open) conn.send('Pulse oximeter probe removed');
                    target1.innerHTML = "--";
                    target2.innerHTML = "--";
               }
          }, pulse);
     }
}

function dispTC(target) {
     tmP = currentValue(temper, temper2, tpDelay, tpTrend);
     if (celsius) {
          cf.innerHTML = "&deg;C";
          if (tmP < 20.0 || tmP > 42.0) {
               target.innerHTML = "Err";
               if (conn && conn.open) conn.send('Temperature out-of-range: ' + 'Err ' + tmP.toFixed(1) + '&deg;C');
          }
          else {
               target.innerHTML = tmP.toFixed(1);
               if (conn && conn.open) conn.send('Temperature taken: ' + tmP.toFixed(1) + '&deg;C');
          }
     }
     else {
          cf.innerHTML = "&deg;F";
          if (tmP < 68.0 || tmP > 107.0) {
               target.innerHTML = "Err";
               if (conn && conn.open) conn.send('Temperature out-of-range: ' + 'Err ' + tmP.toFixed(1) + '&deg;F');
          }
          else {
               target.innerHTML = tmP.toFixed(1);
               if (conn && conn.open) conn.send('Temperature taken: ' + tmP.toFixed(1) + '&deg;F');
          }
     }
}

function dispRR(target) {
     rsP = Math.round(currentValue(respir, respir2, rrDelay, rrTrend));
     target.innerHTML = rsP;
     if (conn && conn.open) conn.send('Respiration rate taken: ' + rsP);
}

function loadSound(url) {
     let audio = document.createElement('audio');
     audio.style.display = "none";
     audio.src = url;
     audio.loop = false;
     document.body.appendChild(audio);
     return audio;
}

function playSound(audio) {
     audio.play();
     current_audio = audio;
}

function onLoadFunction() {
     bpSound = loadSound('./static/sounds/pump.mp3');
     initialize();
     conectToPeer();
     // use the functions below to set initial conditions
     //setECG(false);
     setPatientData('Name: ', 'John Smith', 'ID: ', '234-56789', 'DOB: ', 'July 23, 1964');
     setBloodPressure(120, 80);
     setTemperature(true, 37.0);
     setRespirationRate(14);
     setPulseOximetry(99);
     setHeartRate(72);
}
