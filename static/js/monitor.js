let ractive;
let spO2VarTimer, hfVarTimer;

const normalHfByAgeInDays = [
    [31, 150],
    [366, 120],
    [365 * 5, 120],
    [365 * 10, 80],
    [Infinity, 150]
]

function calculateAgeInYears(dob) {
    var ageDate = new Date(
        Date.now() - dob.getTime()
    );
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function calculateAgeInDays(dob) {
    return (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24)
}

function getHfByDob(dob) {
    ageInDays = calculateAgeInDays(dob);
    for (ageHfPair in normalHfByAgeInDays) {
        if (ageInDays < ageHfPair[0]) {
            return ageHfPair[1];
        }
    }
}

const patient_data = {
    demographics: {
        name: "John",
        surname: "Doe",
        dob: new Date("1970-01-01T00:00:00"),
        pid: "123456789",
    },
    vitals: {
        hf: {
            target: 60,
            display: 60,
            min: 0,
            max: 230,
            varFreq: 1,
            varInterval: 2,
            initInterval: 1
        },
        spO2: {
            target: 100,
            display: 100,
            min: 21,
            max: 100,
            varFreq: 2,
            varInterval: 1,
            initInterval: 10
        },
        bpSys: {
            target: 120,
            display: 120,
            min: 30,
            max: 220,
            varFreq: 10,
            varInterval: null,
            initInterval: 30
        },
        bpDia: {
            target: 60,
            display: 60,
            min: 20,
            max: 100,
            varFreq: 10,
            varInterval: null,
            initInterval: 30
        },
        bf: {
            target: 14,
            display: 14,
            min: 0,
            max: 180,
            varFreq: 5,
            varInterval: 5,
            initInterval: 3
        },
    }
}

function varyParameter(parameterStr) {
    let newDisplay = ractive.get(parameterStr + '.target') + (2 * (Math.random() - 0.5) * ractive.get(parameterStr + '.varInterval'))
    newDisplay = Math.round(newDisplay)
    if (newDisplay > ractive.get(parameterStr + '.max')) {
        newDisplay = ractive.get(parameterStr + '.max')
    }
    if (newDisplay < ractive.get(parameterStr + '.min')) {
        newDisplay = ractive.get(parameterStr + '.min')
    }
    console.log('Changing ' + parameterStr + '.display from ' + ractive.get(parameterStr + '.display') + ' to ' + newDisplay)
    ractive.set(parameterStr + '.display', newDisplay)
};

ractive = new Ractive({
    target: '#ractive-target',
    template: '#ractive-template',
    data: { patient_data: patient_data }
});

if (!hfVarTimer) {
    hfVarTimer = setInterval(varyParameter, patient_data.vitals.hf.varFreq*1000, 'patient_data.vitals.hf');
};

if (!spO2VarTimer) {
    spO2VarTimer = setInterval(varyParameter, patient_data.vitals.spO2.varFreq*1000, 'patient_data.vitals.spO2');
};

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


