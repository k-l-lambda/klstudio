
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


var criterionNotations = null;

var sampleMidiData = null;
var sampleNotations = null;


var Config = {
    KeyWidth: 40,
    KeyHeight: 120,
    ScoreHeightScale: 0.04,
    SampleCanvasLength: 10000000,
    PendingLatency: 800,
    SequenceResetInterval: 4000,
    ContextSpan: { left: -800, right: 800 },
    DistanceSigmoidFactor: 0.01,		// context compare time distance, sigmod x units per ms
    ContextRegressionDiffer: 0.01,		// context compare regression cost derivation default infinitesimal
    ContextRegressionBegin: 10,			// context compare regression begin boundary
    ContextRegressionEnd: 0.01,			// context compare regression cost end condition
    ConnectionBiasCostBenchmark: 800,	// how many ms bias result in cost = 1
    ConnectionClipIndex: 5,
    NullConnectionCost: 2,
    RepeatConnectionCost: 1,
    StartPositionOffsetCost: 1,
};

var PianoConfig = {
    PitchStart: 21,
    PitchEnd: 108,
    MiddleC: 60,
    KeySerials: {
        White: [0, 2, 4, 5, 7, 9, 11],
        BlackPosition: {
            1: 0.94,
            3: 2.06,
            6: 3.92,
            8: 5,
            10: 6.08
        }
    },
};


var PedalControllerTypes = {
    64: "Sustain",
    65: "Portamento",
    66: "Sostenuto",
    67: "Soft"
};


var KeyMap = $.parseJSON(localStorage.KeyMap || null) || {
    // number keys
    49: 60,
    50: 62,
    51: 64,
    52: 65,
    53: 67,
    54: 69,
    55: 71,
    56: 72,
    57: 74,
    48: 76,
    189: 77,
    187: 79,

    // up letters
    81: 76,
    87: 77,
    69: 79,
    82: 81,
    84: 83,
    89: 84,
    85: 86,
    73: 88,
    79: 89,
    80: 91,
    219: 93,
    221: 95,

    // middle letters
    65: 60,
    83: 62,
    68: 64,
    70: 65,
    71: 67,
    72: 69,
    74: 71,
    75: 72,
    76: 74,
    186: 76,
    222: 77,
    220: 79,

    // bottom letters
    90: 48,
    88: 50,
    67: 52,
    86: 53,
    66: 55,
    78: 57,
    77: 59,
    188: 60,
    190: 62,
    191: 64
};

var KeyStatus = {};


var Follower;


var loadMidiFile = function (data, name, filename, onload) {
    //MIDI.Player.timeWarp = timewarp[name];

    MIDI.Player.loadFile(data, function () {
        if (name == "criterion")
            criterionMidiData = MIDI.Player.data;
        else if (name == "sample")
            sampleMidiData = MIDI.Player.data;

        if (onload)
            onload();
    });

    localStorage[name + "_data"] = data;
    localStorage[name + "_filename"] = filename;
};


var svg = function (selector) {
    return new $.svg._wrapperClass($(selector)[0]);
};


var scrollSampleCanvas = function() {
    var now = new Date().getTime();

    var offsetY = now % Config.SampleCanvasLength + 1200 / Config.ScoreHeightScale;
    $("#sample-canvas").css("top", -offsetY * Config.ScoreHeightScale);
};


var pickMidiFile = function (file, elem) {
    if (file && (file.type == "audio/mid" || file.type == "audio/midi")) {
        var fr = new FileReader();
        fr.onloadend = function (e) {
            elem.text(file.name);
            elem.addClass("loading");

            var name = elem.data("name");

            loadMidiFile(e.currentTarget.result, name, file.name, function () {
                elem.removeClass("loading");

                console.log(name + " MIDI file loaded:", file.name);

                if (name == "criterion")
                    loadCriterion();
                else if (name == "sample")
                    restartSamplePlay();
            });
        };
        fr.readAsDataURL(file);
    }
};


var ChannelStatus = [];

var sampleCursorIndex = 0;
var samplePlaying = false;
var samplePaused = false;
var samplePlayHandle = null;

var pressedMap = {};


var noteOn = function (data) {
	MIDI.noteOn(data.channel, data.pitch, data.velocity);

	//$(".keyboard .key[data-note='" + data.pitch + "']").addClass("active");

    var now = Date.now();

    ChannelStatus[data.channel] = ChannelStatus[data.channel] || [];
    ChannelStatus[data.channel][data.pitch] = { start: now, velocity: data.velocity, pitch: data.pitch };

    Follower.onNoteRecord(ChannelStatus[data.channel][data.pitch]);
};

var noteOff = function (data) {
	MIDI.noteOff(data.channel, data.pitch);

	//$(".keyboard .key[data-note='" + data.pitch + "']").removeClass("active");

    var now = Date.now();
    var status = ChannelStatus[data.channel][data.pitch];

    var note = status;
    note.duration = now - status.start;

    var score = svg("#sample-score");

    var time = (note.start % Config.SampleCanvasLength + 1200 / Config.ScoreHeightScale) % Config.SampleCanvasLength;
    if ($("#show-sample-roll")[0].checked)
        paintNote(note, score, {timeOffset: time - note.start});

    setTimeout(function() {
        if (note.graph && !$("#pause").hasClass("paused")) {
            $(note.graph.group).remove();
            note.graph = null;
        }
    }, 2000 / Config.ScoreHeightScale);

    // clear pressed mark
    if (pressedMap[note.pitch] != null)
        setPressedMark(pressedMap[note.pitch], false);
};


var pitchToX = function (pitch) {
	var group = Musical.noteGroup(pitch);
	var step = Musical.notePitch(pitch);
	var pos = PianoConfig.KeySerials.White.indexOf(step);
	if (pos < 0)
		pos = PianoConfig.KeySerials.BlackPosition[step];

	return group * PianoConfig.KeySerials.White.length + pos - 12;
};


var paintNote = function (note, group, options) {
    options = options || {};

    var step = Musical.notePitch(note.pitch);
    var is_white = PianoConfig.KeySerials.White.indexOf(step) >= 0;

    var width = is_white ? (Config.KeyWidth - 2) : Config.KeyWidth * 0.6;

    var start = note.start;
    if (options.timeOffset)
        start += options.timeOffset;

    var left = pitchToX(note.pitch) * Config.KeyWidth - (is_white ? -1 : width / 2);
    var top = start * Config.ScoreHeightScale;
    var height = note.duration * Config.ScoreHeightScale;

    note.position = { x: left + Config.KeyWidth * 0.5, y: top };

    note.graph = note.graph || {}

    var classStr = "note " + (is_white ? "white" : "black") + " step-" + step;
    if (note.matched)
        classStr += " matched";
    if (note.c_index != null)
        classStr += note.c_index >= 0 ? " paired" : "unpaired";
    var note_elem = group.group({ class: classStr, "data-index": options.index });
    var note_group = svg(note_elem);

    var cornorRadius = is_white ? 5 : 0;

    note.graph.group = note_elem;
    note.graph.bar = note_group.rect(left, top, width, height, cornorRadius, cornorRadius, { class: "note-bar" });

    if (note.index != null)
        $(note_elem).append("<title>" + note.index + "</title>");
};


var paintScore = function (group_name, notations) {
	$(group_name).html("");

	var canvasWidth = Config.KeyWidth * (pitchToX(PianoConfig.PitchEnd) + 1);
	$(group_name).parent().attr("viewBox", "0 0 " + (canvasWidth) + " " + (notations.endTime * Config.ScoreHeightScale));
    $(group_name).parent().attr("height", notations.endTime * Config.ScoreHeightScale + 2);

	var group = svg(group_name);

	for (var i in notations.notes) {
		var note = notations.notes[i];

        paintNote(note, group, {index: i});
	}

    $(group_name).html($(group_name).html());
};


var playSample = function(data) {
    var step;
    step = function() {
        if (sampleCursorIndex >= data.length) {
            samplePlaying = false;
            return;
        }

        var event = data[sampleCursorIndex][0].event;
        switch (event.type) {
            case "channel":
                switch (event.subtype) {
                    case "noteOn":
                        pitch = event.noteNumber - (MIDI.Player.MIDIOffset || 0);

                        noteOn({ channel: 0, pitch: pitch, velocity: event.velocity });

                        break;
                    case "noteOff":
                        pitch = event.noteNumber - (MIDI.Player.MIDIOffset || 0);

                        noteOff({ channel: 0, pitch: pitch });

                        break;
                }

                break;
        }

        ++sampleCursorIndex;

        if (sampleCursorIndex >= data.length) {
            samplePlaying = false;
            return;
        }

        var deltaTime = data[sampleCursorIndex][1];
        if (deltaTime > 0) {
            if (samplePlaying)
                samplePlayHandle = setTimeout(step, deltaTime);
        }
        else {
            step();
        }
    };

    samplePlaying = true;

    if (samplePlayHandle)
        clearTimeout(samplePlayHandle);
    samplePlayHandle = setTimeout(step, data[sampleCursorIndex][1]);
};

var restartSamplePlay = function() {
    sampleCursorIndex = 0;

    playSample(sampleMidiData);
};

var pauseSamplePlay = function() {
    samplePlaying = false;
};

var endSamplePlay = function() {
    samplePlaying = false;
    sampleCursorIndex = 0;
    samplePaused = false;
};



var Follower;

var markNotePair = function(c_index, s_index) {
    var c_note = criterionNotations.notes[c_index];
    if (c_note.id) {
        var cnote_g = $("#" + c_note.id);
        if (cnote_g.hasClass("paired")) {
            var old_sindex = cnote_g.data("sindex");

            duplicated = old_sindex != s_index;
            if (duplicated) {
                cnote_g.addClass("duplicated");
            }
        }
        else
            cnote_g.addClass("paired");

        cnote_g.data("sindex", s_index);
    }

    {
        var cnote_g = $("#criterion-score .note[data-index=" + c_index + "]");
        if (cnote_g.hasClass("paired")) {
            var old_sindex = cnote_g.data("sindex");

            duplicated = old_sindex != s_index;
            if (duplicated) {
                cnote_g.addClass("duplicated");
            }
        }
        else
            cnote_g.addClass("paired");

        cnote_g.data("sindex", s_index);
    }
};

var unmarkNotePair = function(c_index) {
    var c_note = criterionNotations.notes[c_index];
    if (c_note.id) {
        var g = $("#" + c_note.id);
        if (g.hasClass("duplicated"))
            g.removeClass("duplicated");
        if (g.hasClass("paired"))
            g.removeClass("paired");
        g.data("sindex", null);
    }

    {
        var g = $("#criterion-score .note[data-index=" + this.Path[c_index] + "]");
        if (g.hasClass("duplicated"))
            g.removeClass("duplicated");
        if (g.hasClass("paired"))
            g.removeClass("paired");
        g.data("sindex", null);
    }
};

var clearNoteMarks = function() {
    $(".note.paired").data("sindex", null);
    $(".note.paired").removeClass("paired");
    $(".note.duplicated").removeClass("duplicated");
    $(".note.pressed").removeClass("pressed");

    {
        $("#criterion-score .paired").data("sindex", null);
        $("#criterion-score .paired").removeClass("paired");
        $("#criterion-score .duplicated").removeClass("duplicated");
        $("#criterion-score .pressed").removeClass("pressed");
    }
};


var setPressedMark = function(c_index, on) {
    var c_note = criterionNotations.notes[c_index];
    if (c_note.id) {
        var g = $("#" + c_note.id);
        if (on)
            g.addClass("pressed");
        else
            g.removeClass("pressed");
    }

    {
        var g = $("#criterion-score .note[data-index=" + c_index + "]");
        if (on)
            g.addClass("pressed");
        else
            g.removeClass("pressed");
    }
};

var markNotePressed = function(c_index) {
    var note = criterionNotations.notes[c_index];

    if (pressedMap[note.pitch] != null)
        setPressedMark(pressedMap[note.pitch], false);

    pressedMap[note.pitch] = c_index;
    setPressedMark(c_index, true);
};


var updateCriterionPosition = function(y) {
    $("#criterion-canvas").css("top", -y * Config.ScoreHeightScale);
};


var updateCriterionPositionByIndex = function(index, elapsed) {
    elapsed = elapsed || 0;

    var note = criterionNotations.notes[index];
    updateCriterionPosition(note.start + elapsed);
};


$(function() {
    MIDI.loadPlugin({
        soundfontUrl: "../soundfont/",
        instrument: "acoustic_grand_piano",
        callback: function () {
            console.log("Sound font loaded.");
        }
    });

    $.getJSON(jsonUrl, function(json) {
        //console.log(json);
        criterionNotations = parseJsonNotations(json);
        //console.log("notation:", notation);

        paintScore("#criterion-score", criterionNotations);

        Follower = new MidiMatch.Follower({
            criterionNotations: criterionNotations,
            markNotePair: markNotePair,
            unmarkNotePair: unmarkNotePair,
            clearNoteMarks: clearNoteMarks,
            onUpdateCriterionPositionByIndex: updateCriterionPositionByIndex,
            markNotePressed: markNotePressed,
        });
    });


    $(".midi-file").each(function (i, elem) {
        elem.ondragover = function (e) {
            $(elem).addClass("drag-hover");
            e.preventDefault();
        };
        elem.ondragleave = function () {
            $(elem).removeClass("drag-hover");
        };

        elem.ondrop = function (e) {
            $(elem).removeClass("drag-hover");

            pickMidiFile(e.dataTransfer.files[0], $(elem));

            e.preventDefault();
            return false;
        };
    });


    $("#sample-file").click(function () {
    	$("#sample-file-input").click();
    });

    $("#sample-file-input").change(function () {
    	if (event.target.files[0])
    		pickMidiFile(event.target.files[0], $("#sample-file"));
    });

    var canvasWidth = Config.KeyWidth * (pitchToX(PianoConfig.PitchEnd) + 1);
    var canvasHeight = Config.SampleCanvasLength * Config.ScoreHeightScale + 2400;
    $("#sample-canvas").attr("viewBox", "0 0 " + (canvasWidth) + " " + (canvasHeight));
    $("#sample-canvas").attr("height", canvasHeight + 2);
    var scrollHandle = setInterval(scrollSampleCanvas, 30);


    $("#pause").click(function() {
        var paused = $("#pause").hasClass("paused");
        if (!paused) {
            $("#pause").addClass("paused");
            //clearInterval(updateHandle);
            clearInterval(scrollHandle);

            pauseSamplePlay();
            samplePaused = true;
        }
        else {
            $("#pause").removeClass("paused");
            //updateHandle = setInterval(updateSequence, 50);
            scrollHandle = setInterval(scrollSampleCanvas, 30);

            samplePaused = false;
            playSample(sampleMidiData);
        }

        $("#pause").text(paused ? "RESTART" : "PAUSE");
    });

    $("#sample-restart").click(function() {
        restartSamplePlay();
    });

    $("#sample-end").click(function() {
        endSamplePlay();
    });


    if (localStorage.sample_data) {
        loadMidiFile(localStorage.sample_data, "sample", localStorage.sample_filename);
        $("#sample-file").text(localStorage.sample_filename);
    }


    $("#show-criterion-roll").change(function(event) {
        if (event.currentTarget.checked)
            $("#criterion-canvas").show();
        else
            $("#criterion-canvas").hide();
    });

    $("#show-sample-roll").change(function(event) {
        if (event.currentTarget.checked)
            $("#sample-canvas").show();
        else
            $("#sample-canvas").hide();
    });


    // keyboard play
    $(document).keydown(function () {
    	if (!event.ctrlKey && KeyMap[event.keyCode]) {
    		if (!KeyStatus[event.keyCode]) {	// to avoid auto-repeat
    			noteOn({ channel: 0, pitch: KeyMap[event.keyCode] + (event.shiftKey ? 1 : 0), velocity: 100 });

    			KeyStatus[event.keyCode] = true;

    			event.preventDefault();
    		}
    	}
    });

    $(document).keyup(function () {
    	if (!event.ctrlKey && KeyMap[event.keyCode]) {
    		noteOff({ channel: 0, pitch: KeyMap[event.keyCode] + (event.shiftKey ? 1 : 0) });

    		KeyStatus[event.keyCode] = false;
    	}
    });

    $(document).keydown(function () {
        //console.log(event.keyCode);
        var unhandled = false;
        switch (event.keyCode) {
            case 32: // Space
                $("#pause").click();

                break;
            case 36:    // Home
                updateCriterionPositionByIndex(0);
                Follower.clearWorkSequence();

                break;
            case 35:    // End
                $("#sample-end").click();

                break;
            default:
                //console.log("unhandled key:", event.keyCode);
                unhandled = true;
        }

        if (!unhandled)
            event.preventDefault();
    });
});
