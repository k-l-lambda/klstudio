
var parseJsonNotations = function(json) {
    var ticksPerBeat = 480;

    var channelStatus = [];
    var pedalStatus = {};
    var pedals = {};
    var channels = [];
    var bars = [];
    var time = 0;
    var millisecondsPerBeat = 600000 / 120;
    var tempoIndex = -1;
    var keyRange = {};

    for (var n = 0; n < json.events.length; ++n) {
        var ev = json.events[n];

        if (json.tempos.length > tempoIndex + 1 && json.tempos[tempoIndex + 1].tick >= ev.tick) {
            ++tempoIndex;
            millisecondsPerBeat = json.tempos[tempoIndex].tempo / 1000;
        }

        time = (ev.tick / ticksPerBeat) * millisecondsPerBeat;

        var event = ev.event;
        if (!event)
            continue;

        var channel = event[0] & 0xf;
        channelStatus[channel] = channelStatus[channel] || [];

        switch (event[0] & 0xf0) {
            case 0x90:
                pitch = event[1];
                if (channelStatus[channel][pitch])
                    console.warn("unexpected noteOn: ", n, time, event);
                channelStatus[channel][pitch] = { start: time, velocity: event[2], id: ev.id };

                keyRange.low = Math.min(keyRange.low || pitch, pitch);

                break;
            case 0x80:
                pitch = event[1];

                channels[channel] = channels[channel] || [];

                var status = channelStatus[channel][pitch];
                if (!status)
                    console.warn("unexpected noteOff: ", n, time, event);
                else {
                    channels[channel].push({ pitch: pitch, start: status.start, duration: time - status.start, velocity: status.velocity, id: status.id });
                    channelStatus[channel][pitch] = null;
                }

                keyRange.high = Math.max(keyRange.high || pitch, pitch);

                break;
            /*case "controller":
                switch (event.controllerType) {
                    // pedal controllers
                            case 64:
                            case 65:
                            case 66:
                            case 67:
                                var pedalType = PedalControllerTypes[event.controllerType];

                                pedalStatus[channel] = pedalStatus[channel] || {};
                                pedals[channel] = pedals[channel] || [];

                                var status = pedalStatus[channel][pedalType];

                                if (event.value > 0) {
                                    if (!status)
                                        pedalStatus[channel][pedalType] = { start: time, value: event.value };
                                }
                                else {
                                    if (status) {
                                        pedals[channel].push({ type: pedalType, start: status.start, duration: time - status.start, value: status.value });

                                        pedalStatus[channel][pedalType] = null;
                                    }
                                }

                                break;
                }

                break;*/
        }
    }


    var notes = [];
    for (var c in channels) {
        for (var n in channels[c]) {
            notes.push(channels[c][n]);
        }
    }
    notes.sort(function (n1, n2) {
        return n1.start - n2.start;
    });

    for (var i in notes)
        notes[i].index = Number(i);


    var pitchMap = [];
    for (var c in channels) {
        for (var n in channels[c]) {
            var pitch = channels[c][n].pitch
            pitchMap[pitch] = pitchMap[pitch] || [];

            pitchMap[pitch].push(channels[c][n]);
        }
    }

    for (var pitch in pitchMap)
        pitchMap[pitch].sort(function (n1, n2) {
            return n1.start - n2.start;
        });

    return { channels: channels, notes: notes, pitchMap: pitchMap, pedals: pedals, bars: bars, endTime: time, keyRange: keyRange };
};


$(function() {
    $.getJSON(jsonUrl, function(json) {
        //console.log(json);
        var notation = parseJsonNotations(json);
        console.log("notation:", notation);
    });
});
