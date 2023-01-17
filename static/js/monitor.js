let ractive;
let busTimer, signalUpdateTimer;
let runtime = 0;
const updateInterval = 100;
const signalPixelsPerSecond = 200;
const contexts = {};
const bufferPointers = {};
const signalsLineWidths = {
    'ecg': 4,
    'spO2': 4
};
const signalStrokeStyles = {
    'ecg': 'lawngreen',
    'spO2': "skyblue"
};

class VitalDefinition {
    constructor(target, min, max, varFreq, varAmp, initDelay) {
        this.target = target
        this.min = min
        this.max = max
        this.varFreq = varFreq
        this.varAmp = varAmp
        this.initDelay = initDelay
    }
}

class Patient {
    firstName = "John"
    surname = "Doe"
    dob = new Date("1970-01-01T00:00:00")
    pid = "123456789"
    constructor(firstName, surname, dob, pid) {
        this.firstName = firstName
        this.surname = surname
        this.dob = dob
        this.pid = pid
    }

    get fullName() {
        return this.surname + ", " + this.firstName
    }

    get ymdDob() {
        let fullMonth = (this.dob.getMonth() + 1 < 10) ? '0' + (this.dob.getMonth() + 1) : this.dob.getMonth() + 1
        let fullDate = (this.dob.getDate() < 10) ? '0' + this.dob.getDate() : this.dob.getDate()
        return (this.dob.getFullYear() + '-' + fullMonth + '-' + fullDate)
    }

    get ageInYears() {
        var ageDate = new Date(
            Date.now() - this.dob.getTime()
        );
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    get ageInDays() {
        return (Date.now() - this.dob.getTime()) / (1000 * 60 * 60 * 24)
    }
}

function bufferNextCurve(parameterName, amplitude = 0.9) {
    let signalContext = contexts[parameterName]["signal"];
    let bufferContext = contexts[parameterName]["buffer"];
    let bufferPointer = bufferPointers[parameterName];
    let curveEvent = ractive.get("display.curveEvents." + parameterName)
    let eventRate = ractive.get("display." + curveEvent)

    // Adapt buffer size to one heart beat:
    let bufferWidth = bufferContext.canvas.width = 60 / eventRate * signalPixelsPerSecond;
    let bufferHeigth = bufferContext.canvas.height = signalContext.canvas.height - signalContext.lineWidth * 2

    // Set line color and width:
    bufferContext.strokeStyle = signalContext.strokeStyle;
    bufferContext.lineWidth = signalContext.lineWidth;

    // pleth signal height could be adjusted later:
    let maxSigHeight = bufferHeigth * amplitude
    let minValue = bufferHeigth - bufferContext.lineWidth
    // calculate points to draw curve
    if (parameterName === "spO2") {
        points = [
            { x: 0, y: minValue },
            { x: 0.1 * bufferWidth, y: minValue },
            { x: 0.2 * bufferWidth, y: minValue - maxSigHeight },
            { x: 0.4 * bufferWidth, y: minValue - 0.4 * maxSigHeight },
            { x: 0.7 * bufferWidth, y: minValue - 0.5 * maxSigHeight },
            { x: 0.9 * bufferWidth, y: minValue },
            { x: 1 * bufferWidth, y: minValue },
        ]
    } else {
        points = [
            { x: 0, y: minValue - maxSigHeight },
            { x: 0.03 * bufferWidth, y: minValue - 0.1 * maxSigHeight },
            { x: 0.1 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.2 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.275 * bufferWidth, y: minValue - 0.35 * maxSigHeight },
            { x: 0.35 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.5 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.625 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.7 * bufferWidth, y: minValue - 0.35 * maxSigHeight },
            { x: 0.775 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.9 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 0.97 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
            { x: 1 * bufferWidth, y: minValue - maxSigHeight },
        ]
    }

    // interpolate curve
    // from: https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    bufferContext.moveTo(points[0].x, points[0].y);
    for (i = 1; i < points.length - 2; i++) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        bufferContext.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    bufferContext.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    bufferContext.stroke();
    bufferPointer.pos = 0;
    bufferPointer.size = bufferWidth;
}

function animateSignal(parameterName) {
    signalContext = contexts[parameterName]['signal']
    bufferContext = contexts[parameterName]['buffer']
    bufferPointer = bufferPointers[parameterName]
    if (!(bufferPointer.pos < bufferPointer.size)) {
        bufferNextCurve(parameterName);
    }
    bufferContext.save;
    let bufferedCol = bufferContext.getImageData(bufferPointer.pos, 0, 1, signalContext.canvas.height)
    // shift everything to the left:
    oldImageData = signalContext.getImageData(1, 0, signalContext.canvas.width - 1, signalContext.canvas.height)
    signalContext.putImageData(oldImageData, 0, 0);
    // Write buffer column to right end:
    signalContext.putImageData(bufferedCol, signalContext.canvas.width - 1, 0);

    bufferPointer.pos = bufferPointer.pos + 1;
    bufferContext.restore()
}

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

function updateCanvases(parameterNames) {
    parameterNames.forEach(parameterName => {
        currentContext = contexts[parameterName]["signal"]
        currentContext.canvas.width = currentContext.canvas.parentElement.clientWidth;
        currentContext.lineWidth = signalLineWidths[parameterName];
        currentContext.strokeStyle = signalStrokeStyles[parameterName];
        console.log(signalLineWidths[parameterName]);
    });
}

ractive = new Ractive({
    target: '#ractive-target',
    template: '#ractive-template',
    data: {
        patient: new Patient(
            firstName = "John",
            surname = "Doe",
            dob = new Date("1970-01-01T00:00:00"),
            pid = "123456789",
        ),
        vitals: {
            hf: new VitalDefinition(
                target = 60,
                min = 0,
                max = 230,
                varFreq = 2000,
                varAmp = 2,
                initDelay = 1000
            ),
            spO2: new VitalDefinition(
                target = 100,
                min = 21,
                max = 100,
                varFreq = 2000,
                varAmp = 1,
                initDelay = 10000
            ),
            resp: new VitalDefinition(
                target = 14,
                min = 0,
                max = 180,
                varFreq = 5000,
                varAmp = 5,
                initDelay = 3000
            ),
            bpSys: new VitalDefinition(
                target = 120,
                min = 30,
                max = 220,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000
            ),
            bpDia: new VitalDefinition(
                target = 60,
                min = 20,
                max = 100,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000
            ),
            temp: new VitalDefinition(
                target = 37.5,
                min = 36.0,
                max = 41.5,
                varFreq = 5000,
                varAmp = 0.5,
                initDelay = 30000
            ),
        },
        display: {
            curveEvents: {
                ecg: 'hf',
                spO2: 'hf',
                resp: 'resp'
            },
            triggers: {
                ecg: true,
                spO2: true,
                resp: false,
                bp: false,
                temp: false,
            }
        },
        connected: false,
    }
});

function initCanvasContexts(parameterName) {
    contexts[parameterName] = {}
    contexts[parameterName]['signal'] = ractive.find("#" + parameterName + "SigCanvas").getContext("2d", { willReadFrequently: true });
    contexts[parameterName]['buffer'] = ractive.find("#" + parameterName + "BufferCanvas").getContext("2d", { willReadFrequently: true });
}

function varyParameter(parameterName) {
    let fullParameterStr = 'vitals.' + parameterName
    let parameterMax = ractive.get(fullParameterStr + '.max')
    let parameterMin = ractive.get(fullParameterStr + '.min')
    let newDisplay = Math.round(
        ractive.get(fullParameterStr + '.target')
        + (2 * (Math.random() - 0.5) * ractive.get(fullParameterStr + '.varAmp'))
    )
    newDisplay = Math.max(
        Math.min(
            newDisplay, parameterMax
        ), parameterMin
    )

    ractive.set('display.' + parameterName, newDisplay)
};

function fitToContainer(canvas) {
    canvas.height = canvas.parentElement.clientHeight;
    canvas.width = canvas.parentElement.clientWidth;
}

function updateMonitor(parameterNames = []) {
    runtime += updateInterval;
    ractive.set('display.dateTime', new Date().toLocaleString());
    parameterNames.forEach(parameter => {
        if (
            runtime % ractive.get("vitals." + parameter + ".varFreq") < updateInterval
        ) {
            varyParameter(parameter)
        }
    });
}

function drawSignals() {
    let triggers = ractive.get('display.triggers');
    Object.entries(triggers).forEach(([parameterName, triggerState]) => {
        if (triggerState) {
            animateSignal(parameterName)
        }
    })
}

if (!busTimer) {
    busTimer = setInterval(updateMonitor, updateInterval, ['hf', 'spO2'])
}

if (!signalUpdateTimer) {
    signalUpdateTimer = setInterval(drawSignals, 1000 / signalPixelsPerSecond);
}

initCanvasContexts("ecg");
initCanvasContexts("spO2");
bufferPointers["ecg"] = {
    pos: 0,
    size: 0,
};
bufferPointers["spO2"] = {
    pos: 0,
    size: 0,
};
window.addEventListener("resize", () => { updateCanvases(['ecg', 'spO2']) });
updateMonitor()
updateCanvases(['ecg', 'spO2']);