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

/**
 * Helper function to emit a beep sound in the browser using the Web Audio API.
 * Taken from https://ourcodeworld.com/articles/read/1627/how-to-easily-generate-a-beep-notification-sound-with-javascript
 * 
 * @param {number} duration - The duration of the beep sound in milliseconds.
 * @param {number} frequency - The frequency of the beep sound.
 * @param {number} volume - The volume of the beep sound.
 * @param {AudioContext} audioContext - The audio context to use.
 * 
 * @returns {Promise} - A promise that resolves when the beep sound is finished.
 **/
function beep(duration, frequency, volume, audioContext){
    if (!audioContext | !(audioContext instanceof AudioContext)) {
        throw new Error("No valid AudioContext given.")
    }
    
    return new Promise((resolve, reject) => {
        // Set default duration if not provided
        duration = duration || 200;
        frequency = frequency || 440;
        volume = volume || 100;

        try {
            myAudioContext = new (AudioContext)
            let oscillatorNode = myAudioContext.createOscillator();
            let gainNode = myAudioContext.createGain();
            oscillatorNode.connect(gainNode);

            // Set the oscillator frequency in hertz
            oscillatorNode.frequency.value = frequency;

            // Set the type of oscillator
            oscillatorNode.type= "sine";
            gainNode.connect(myAudioContext.destination);

            // Set the gain to the volume
            gainNode.gain.value = volume * 0.01;

            // Start audio with the desired duration
            oscillatorNode.start(myAudioContext.currentTime);
            oscillatorNode.stop(myAudioContext.currentTime + duration * 0.001);

            // Resolve the promise when the sound is finished
            oscillatorNode.onended = () => {
                    myAudioContext.close();
                    resolve();
            };
        } catch (error) {
            reject(error);
        }
    });
}