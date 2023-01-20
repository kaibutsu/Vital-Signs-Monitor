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
            hfEcg: new VitalDefinition(
                target = 60,
                min = 0,
                max = 230,
                varFreq = 1000,
                varAmp = 1,
                initDelay = 1000,
                trigger = 'ecg',
                override = false,
            ),
            hfSpO2: new VitalDefinition(
                target = 60,
                min = 0,
                max = 230,
                varFreq = 2000,
                varAmp = 2,
                initDelay = 10000,
                trigger = 'spO2',
                override = 'hfEcg',
            ),
            spO2: new VitalDefinition(
                target = 100,
                min = 21,
                max = 100,
                varFreq = 2000,
                varAmp = 1,
                initDelay = 10000,
                trigger = 'spO2',
                override = false,
            ),
            resp: new VitalDefinition(
                target = 14,
                min = 0,
                max = 180,
                varFreq = 5000,
                varAmp = 5,
                initDelay = 3000,
                trigger = 'resp',
                override = false,
            ),
            nbpSys: new VitalDefinition(
                target = 120,
                min = 30,
                max = 220,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000,
                trigger = 'nbp',
                override = false,
            ),
            nbpDia: new VitalDefinition(
                target = 60,
                min = 20,
                max = 100,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000,
                trigger = 'nbp',
                override = false,
            ),
            temp: new VitalDefinition(
                target = 37.5,
                min = 36.0,
                max = 41.5,
                varFreq = 5000,
                varAmp = 0.5,
                initDelay = 30000,
                trigger = 'temp',
                override = false,
            ),
        },
        display: {
            colors: {
                ecg: "lawngreen",
                spO2: "skyblue",
                nbp: "GhostWhite",
                resp: "gold",
                temp: "orange",
            },
            signals: {
                spO2: new SignalDefinition(
                    eventParameter = 'hfEcg',
                    trigger = 'spO2'),
                ecg: new SignalDefinition(
                    eventParameter = 'hfEcg',
                    trigger = 'ecg'),
                resp: new SignalDefinition(
                    eventParameter = 'resp',
                    trigger = 'resp'),
            },
            triggers: {
                ecg: true,
                spO2: true,
                resp: false,
                nbp: false,
                temp: false,
            },
        },
        connected: false,
    }
});

ractive.observe('display.triggers.*', (newValue, oldValue, keypath) => {
    triggerName = keypath.split('.').pop();
    Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
        if (signalDef.trigger === triggerName) {
            updateCanvas(signalName)
        }
    })
}, {'init': false, 'defer': true });

window.addEventListener("resize", () => {
    Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
        updateCanvas(signalName);
    })
});

Object.entries(ractive.get("display.signals")).forEach(([signalName, signalDef]) => {
    initCanvasContexts(signalName);
    bufferPointers[signalName] = {
        pos: 0,
        size: 0,
    }
})

Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
    updateCanvas(signalName);
})

if (!busTimer) {
    busTimer = setInterval(updateMonitor, updateInterval)
}

if (!signalUpdateTimer) {
    signalUpdateTimer = setInterval(() => {
        Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
            animateSignal(signalName)
        })
    }, 1000 / signalPixelsPerSecond);
}