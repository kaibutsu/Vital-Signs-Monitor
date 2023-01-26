ractive = new Ractive({
    target: '#ractive-target',
    template: '#ractive-template',
    data: {
        patient: new Patient(
            firstName = 'John',
            surname = 'Doe',
            dob = new Date('1970-01-01T00:00:00'),
            pid = '123456789',
        ),
        vitals: {
            hfEcg: new VitalDefinition(
                name = 'hfEcg',
                title = 'HF<sub>ECG</sub> (bpm)',
                target = 60,
                min = 0,
                max = 230,
                varFreq = 1000,
                varAmp = 1,
                initDelay = 1000,
                trigger = 'ecg',
                override = '',
            ),
            hfPleth: new VitalDefinition(
                name = 'hfPleth',
                title = 'HF<sub>Pleth</sub> (bpm)',
                target = 60,
                min = 0,
                max = 230,
                varFreq = 2000,
                varAmp = 2,
                initDelay = 10000,
                trigger = 'pleth',
                override = 'hfEcg',
            ),
            pleth: new VitalDefinition(
                name = 'pleth',
                title = 'SpO<sub>2</sub> (%)',
                target = 100,
                min = 21,
                max = 100,
                varFreq = 2000,
                varAmp = 1,
                initDelay = 10000,
                trigger = 'pleth',
                override = '',
            ),
            resp: new VitalDefinition(
                name = 'resp',
                title = 'Resp (bpm)',
                target = 14,
                min = 0,
                max = 180,
                varFreq = 5000,
                varAmp = 5,
                initDelay = 3000,
                trigger = 'resp',
                override = '',
            ),
            nbpSys: new VitalDefinition(
                name = 'nbpSys',
                title = 'NPB<sub>SYS</sub> (mmHg)',
                target = 120,
                min = 30,
                max = 220,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000,
                trigger = 'nbp',
                override = '',
            ),
            nbpDia: new VitalDefinition(
                name = 'nbpDia',
                title = 'NPB<sub>DIA</sub> (mmHg)',
                target = 60,
                min = 20,
                max = 100,
                varFreq = 10000,
                varAmp = null,
                initDelay = 30000,
                trigger = 'nbp',
                override = '',
            ),
            temp: new VitalDefinition(
                name = 'temp',
                title = 'Temp (&deg;C)',
                target = 37.5,
                min = 36.0,
                max = 41.5,
                varFreq = 5000,
                varAmp = 0.5,
                initDelay = 30000,
                trigger = 'temp',
                override = '',
            ),
        },
        display: {
            colors: {
                ecg: 'lawngreen',
                pleth: 'skyblue',
                nbp: 'GhostWhite',
                resp: 'gold',
                temp: 'orange',
            },
            signals: {
                pleth: new SignalDefinition(
                    name = 'pleth',
                    title = 'Pleth',
                    eventParameter = 'hfEcg',
                    trigger = 'pleth'),
                ecg: new SignalDefinition(
                    name = 'ecg',
                    title = 'ECG',
                    eventParameter = 'hfEcg',
                    trigger = 'ecg'),
                resp: new SignalDefinition(
                    name = 'resp',
                    title = 'Resp',
                    eventParameter = 'resp',
                    trigger = 'resp'),
            },
            triggers: {
                ecg: true,
                pleth: true,
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
}, { 'init': false, 'defer': true });

window.addEventListener('resize', () => {
    Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
        updateCanvas(signalName);
    })
});

Object.entries(ractive.get('display.signals')).forEach(([signalName, signalDef]) => {
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