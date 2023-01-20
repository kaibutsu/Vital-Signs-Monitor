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

function varyParameter(parameterName) {
    parameter = ractive.get('vitals.' + parameterName)

    if (parameter.override) {
        ractive.set(
            'display.' + parameterName,
            ractive.get('display.' + parameter.override)
        );
        return;
    }

    let newDisplay = Math.round(
        parameter.target
        + (2 * (Math.random() - 0.5) * parameter.varAmp)
    )
    newDisplay = Math.max(
        Math.min(
            newDisplay, parameter.max
        ), parameter.min
    )

    ractive.set('display.' + parameterName, newDisplay)
};

function initializePeer() {
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

function updateMonitor() {
    let vitals = ractive.get('vitals');

    runtime += updateInterval;
    ractive.set('display.dateTime', new Date().toLocaleString());

    Object.entries(vitals).forEach(([parameterName, parameterDef]) => {
        if (
            runtime % ractive.get("vitals." + parameterName + ".varFreq") < updateInterval
        ) {
            varyParameter(parameterName)
        }
    });
}