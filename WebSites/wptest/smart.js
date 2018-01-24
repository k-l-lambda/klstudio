
console.log("smart.js loaded.");


var TICKS_PER_BEATS = 480;


var loadScript = function(url, onload) {
	var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url);

    if (script.addEventListener && onload)
        script.addEventListener("load", onload, false);

    document.getElementsByTagName('head')[0].appendChild(script);
};


var loadCss = function(url) {
    var link = document.createElement("link");
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "StyleSheet");
    link.setAttribute("href", url);

    document.getElementsByTagName('head')[0].appendChild(link);
};


var dir = document.querySelector('script[src$="smart.js"]').getAttribute("src");
var name = dir.split("/").pop();
dir = dir.replace("/" + name, "/");


var criterionMidiInfo = null;
var criterionNotations = null;
var sampleMidiInfo = null;

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
    HesitateIntervalBenchmark: 1200, 	// how many ms hesitate, coeffient equal 1/e
    ConnectionClipIndex: 5,
    NullConnectionCost: 2,
    RepeatConnectionCost: 1,
    StartPositionOffsetCost: 1,
    StepDecay: 0.96,
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

var Follower = null;

var ChannelStatus = [];

var KeyMap = {
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

var pressedMap = {};


loadScript(dir + "../js/jquery.js", function() {
    loadScript(dir + "../js/jquery.svg.js", function() {
        //console.log("jQuery loaded.");


        $(function() {
            console.log("document loaded.");

			var load;
			load = function() {
				if (!window.MidiMatch) {
					// waiting for MidiMatch loading
					setTimeout(load, 1000);
					return;
				}

				var midiData = /*window.midiInfo_sp ||*/ window.midiInfo;

				sampleMidiInfo = window.midiInfo || window.midiInfo_sp;

				if (midiData)
					initializePage(midiData);
				else if (window.midiJson) {
					$.getJSON(midiJson, function(json) {
						sampleMidiInfo = json;
						initializePage(json);
					});
				}
			};

			load();
        });
    });
});

loadScript(dir + "../js/MusicalUtils.js");
loadScript(dir + "MidiMatch.js");
loadScript(dir + "evaluation.js");

loadCss(dir + "MusicSheetView.css");


var parseJsonNotations = function(json) {
    var channelStatus = [];
    var pedalStatus = {};
    var pedals = {};
    var channels = [];
    var bars = [];
    var time = 0;
    var millisecondsPerBeat = 60000 / 120;
    var tempoIndex = -1;
    var keyRange = {};

    for (var n = 0; n < json.events.length; ++n) {
        var ev = json.events[n];

        if (json.tempos.length > tempoIndex + 1 && json.tempos[tempoIndex + 1].tick >= ev.tick) {
            ++tempoIndex;
            millisecondsPerBeat = json.tempos[tempoIndex].tempo / 1000;
        }

        time = (ev.tick / TICKS_PER_BEATS) * millisecondsPerBeat;

        var event = ev.event;
        if (!event)
            continue;

        var channel = event[0] & 0xf;
        channelStatus[channel] = channelStatus[channel] || [];

        switch (event[0] & 0xf0) {
            case 0x90:  // noteOn
                pitch = event[1];
                if (channelStatus[channel][pitch])
                    console.warn("unexpected noteOn: ", n, time, event);
                channelStatus[channel][pitch] = { start: time, velocity: event[2], id: ev.id, beats: ev.tick / TICKS_PER_BEATS, startTick: ev.tick };

                keyRange.low = Math.min(keyRange.low || pitch, pitch);

                break;
            case 0x80:  // noteOff
                pitch = event[1];

                channels[channel] = channels[channel] || [];

                var status = channelStatus[channel][pitch];
                if (!status)
                    console.warn("unexpected noteOff: ", n, time, event);
                else {
                    channels[channel].push({ pitch: pitch, start: status.start, duration: time - status.start, velocity: status.velocity, id: status.id, beats: status.beats, startTick: status.startTick });
                    channelStatus[channel][pitch] = null;
                }

                keyRange.high = Math.max(keyRange.high || pitch, pitch);

                break;
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


var svg = function (selector) {
    return new $.svg._wrapperClass($(selector)[0]);
};


var scrollSampleCanvas = function() {
    var now = new Date().getTime();

    var offsetY = now % Config.SampleCanvasLength + 1200 / Config.ScoreHeightScale;
    $("#sample-canvas").css("top", -offsetY * Config.ScoreHeightScale);
};


var clearEvaluation = function() {
    $("#status-note").html("");

    $(".note").removeClass("eval-fine");
    $(".note").removeClass("eval-fast1");
    $(".note").removeClass("eval-fast2");
	$(".note").removeClass("eval-fast3");
    $(".note").removeClass("eval-slow1");
    $(".note").removeClass("eval-slow2");
	$(".note").removeClass("eval-slow3");

	$("#wuxianpu .mark-error").remove();
};

var paintEvaluation = function(eval) {
	// summary
    var summary = "演奏了<em>" + eval.note_count + "</em>个音符，覆盖乐谱<em>" + (eval.coverage * 100).toPrecision(4) + "%</em>，错音<em>"
        + eval.error_note_count + "</em>个，漏音<em>" + eval.omit_note_count + "</em>个，重音<em>" + eval.retraced_note_count
        + "</em>个，正确率<em>" + (eval.accuracy * 100).toPrecision(4) + "%</em>，流畅度<em>"
        + (eval.fluency2 * 100).toPrecision(4) + ", " + (eval.fluency3 * 100).toPrecision(4) + "%</em>，力度准确性<em>" + (eval.intensity * 100).toPrecision(4) + "%</em>";
    $("#status-summary").html(summary);
    $("#status-bar").removeClass("playing");

	// error note marks
	var ref_note = null;
	for (var i = _sequence.length - 1; i >= 0; --i) {
		var s_note = _sequence[i];

		//console.log("s:", i, s_note.c_index, s_note.eval.tempo);

		if (s_note.c_index >= 0) {
			if (s_note.eval.tempo)
				ref_note = s_note;
		}
		else if (ref_note) {
			var deltaBeats = (s_note.start - ref_note.start) / ref_note.eval.tempo;
			var c_note = criterionNotations.notes[ref_note.c_index];
			//console.log("em:", i, s_note, ref_note, c_note);
			if (c_note) {
				var tick = c_note.startTick + deltaBeats * TICKS_PER_BEATS;
				var position = lookupScorePosition(tick);
				//console.log("error mark:", position);

				var line = svg("#line_" + position.line);
				line.use(position.x, -70, 0, 0, "#mark-arrow", {class: "mark-error"});
			}
		}
	}

	// tempo marks
    for (var i in _correspondence) {
        var cnote = criterionNotations.notes[i];
        var g = $("#" + cnote.id);
        if (g) {
            var si = _correspondence[i];
            var snote = _sequence[si];
            if (snote && snote.eval) {
                var tempo_contrast = snote.eval.tempo_contrast;
                if (tempo_contrast != null) {
                    if (tempo_contrast > 3)
                        g.addClass("eval-slow3");
                    else if (tempo_contrast > 1.6)
                        g.addClass("eval-slow2");
					else if (tempo_contrast > 1.1)
	                    g.addClass("eval-slow1");
					else if (tempo_contrast > 1 / 1.1)
	                    g.addClass("eval-fine");
                    else if (tempo_contrast > 1 / 1.6)
                        g.addClass("eval-fast1");
                    else if (tempo_contrast > 1 / 3)
                        g.addClass("eval-fast2");
                    else if (tempo_contrast <= 1 / 3)
                        g.addClass("eval-fast3");
                }
            }
        }
    }
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
    width = Math.max(width, 0);
    height = Math.max(height, 0);
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


var markNotePair = function(c_index, s_index) {
    var c_note = criterionNotations.notes[c_index];
    //if (!c_note)
    //    console.log("c note not found:", c_index);
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

var lookupMeasureNoteIndex = function(tick) {
	var result = {m: 0, n: 0, percent: 0};

	var lastTick = 0;

	for (var mt in criterionMidiInfo.measures) {
		var measure = criterionMidiInfo.measures[mt];

		for (var i in measure.note_ticks) {
			var t = Number(mt) + Number(measure.note_ticks[i]);
			if (t > tick) {
				result.percent = (tick - lastTick) / (t - lastTick);

				return result;
			}

			result.m = measure.measure;
			result.n = Number(i);

			lastTick = t;
		}
	}

	return result;
};

var lookupScorePosition = function(tick) {
	var index = lookupMeasureNoteIndex(tick);
	var pos = meas_pos[index.m];
	var x = 0;

	if(index.n < 0) {
		if (pos.notes.length > 0) {
			x = pos.notes[0];
			x += (pos.pos.x + pos.pos.w - x) * index.percent;
		}
		else
			x = pos.pos.x + pos.pos.w * index.percent;
	}
	else if (index.n < pos.notes.length) {
		x = pos.notes[index.n];
		if (index.n < pos.notes.length - 1)
			x += (pos.notes[index.n + 1] - x) * index.percent;
		else
			x += (pos.pos.x + pos.pos.w - x) * index.percent;
	}
	else
		x = pos.pos.x + pos.pos.w;

	return {line: pos.line, x: x};
};

var setProgressLine = function(tick) {
    if (showProgressLineMm) {
        var position = lookupMeasureNoteIndex(tick);

        var mm = position.m;
        var nn = position.n;
        if (meas_pos[mm - meas_start] && nn < meas_pos[mm - meas_start].notes.length - 1) {
			showProgressLineMm(mm, nn, 0);
			//console.log("show line:", tick, mm, nn);
		}
    }
};


var setPressedMark = function(c_index, on) {
    var c_note = criterionNotations.notes[c_index];
    if (c_note.id) {
        var g = $("#" + c_note.id);
        if (on) {
			g.addClass("pressed");

			setProgressLine(c_note.startTick);
		}
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
	//console.log("pressed:", c_index, Follower.CeriterionIndex, note.startTick);

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


var noteOn = function (data) {
    //console.log("noteOn:", data);

    var now = Date.now();

    ChannelStatus[data.channel] = ChannelStatus[data.channel] || [];
    ChannelStatus[data.channel][data.pitch] = { start: now, velocity: data.velocity, pitch: data.pitch };

    Follower.onNoteRecord(ChannelStatus[data.channel][data.pitch]);

    if (!$("#status-bar").hasClass("playing")) {
        clearEvaluation();
        $("#status-bar").addClass("playing");
    }
};

var noteOff = function (data) {
    //console.log("noteOff:", data);

    var now = Date.now();
    var status = ChannelStatus[data.channel][data.pitch];
    if (!status)
        return;

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


var sampleCursorIndex = 0;
var samplePlaying = false;
var samplePaused = false;
var samplePlayHandle = null;


var playSampleEvent = function(event) {
	var channel = event.event[0] & 0x0f;

	switch (event.event[0] & 0xf0) {
		case 0x90:
			pitch = event.event[1];
			noteOn({ channel: channel, pitch: pitch, velocity: event.event[2] });

			break;
		case 0x80:
			pitch = event.event[1];
			noteOff({ channel: channel, pitch: pitch });

			break;
	}
};

var tabPlaySample = function() {
	if ($("#playing-sample").hasClass("playing"))
		$("#playing-sample").click();

	var data = sampleMidiInfo;

	var event = data.events[sampleCursorIndex];
	playSampleEvent(event);

	var startTick = event.tick;

	++sampleCursorIndex;

	while (sampleCursorIndex < data.events.length && data.events[sampleCursorIndex].tick - startTick < 60) {
		playSampleEvent(data.events[sampleCursorIndex]);
		++sampleCursorIndex;
	}
};

var playSample = function(data) {
	var TICK_TO_MS = 1000 / TICKS_PER_BEATS;

    var step;
    step = function() {
        if (sampleCursorIndex >= data.events.length) {
            samplePlaying = false;

			if ($("#playing-sample").hasClass("playing"))
				$("#playing-sample").click();

            return;
        }

        var event = data.events[sampleCursorIndex];
		playSampleEvent(event);

        ++sampleCursorIndex;

        if (sampleCursorIndex >= data.length) {
            samplePlaying = false;
			sampleCursorIndex = 0;
            return;
        }

		var deltaTicks = data.events[sampleCursorIndex].tick - data.events[sampleCursorIndex - 1].tick;

        if (deltaTicks > 0) {
            if (samplePlaying)
                samplePlayHandle = setTimeout(step, deltaTicks  * TICK_TO_MS);
        }
        else {
            step();
        }
    };

	var deltaTicks = 0;
	if (sampleCursorIndex > 0)
		deltaTicks = data.events[sampleCursorIndex].tick - data.events[sampleCursorIndex - 1].tick;

    samplePlaying = true;

    if (samplePlayHandle)
        clearTimeout(samplePlayHandle);
    samplePlayHandle = setTimeout(step, deltaTicks * TICK_TO_MS);
};

/*var restartSamplePlay = function() {
    sampleCursorIndex = 0;

    playSample(sampleMidiInfo);
};*/

var pauseSamplePlay = function() {
    samplePlaying = false;
};

var resumeSamplePlay = function() {
	if (sampleCursorIndex >= sampleMidiInfo.events.length)
		sampleCursorIndex = 0;

    playSample(sampleMidiInfo);
};

/*var endSamplePlay = function() {
    samplePlaying = false;
    sampleCursorIndex = 0;
    samplePaused = false;
};*/



var initializePage = function(midiData) {
	criterionMidiInfo = midiData;

	// load MIDI notation
	criterionNotations = parseJsonNotations(midiData);
	MidiMatch.genNotationContext(criterionNotations);

	//console.log("notation:", criterionNotations);


	// mount DOM, paint criternion
	$("body").append(
'			<div id="viewer">' +
'               <div id="criterion-area">' +
'                    <div class="middle-wrapper">' +
'                        <svg id="criterion-canvas" preserveAspectRatio="none">' +
'                            <g id="criterion-score"></g>' +
'                        </svg>' +
'                    </div>' +
'                </div>' +
'                <div id="sample-area">' +
'                    <div class="middle-wrapper">' +
'                        <svg id="sample-canvas" preserveAspectRatio="none">' +
'                            <g id="sample-score"></g>' +
'                        </svg>' +
'                    </div>' +
'                </div>' +
'            </div>' +
'            <span id="smart-logo">S</span>' +
'            <div id="controllers">' +
'				<span class="section">' +
'					<button id="playing-sample"></button>' +
'				</span>' +
'                <span class="section">' +
'                    <input id="show-criterion-roll" type="checkbox" />' +
'                    <input id="show-sample-roll" type="checkbox" />' +
'                </span>' +
'            </div>' +
'            <div id="status-bar">' +
'               <span id="status-summary"></span>' +
'               <span id="status-note"></span>' +
'            </div>');

	paintScore("#criterion-score", criterionNotations);

	for (var i in criterionNotations.notes) {
		var note = criterionNotations.notes[i];

		if (note.id) {
			var g = $("#" + note.id);
			if (g) {
				g.data("index", note.index);
				g.addClass("note");
			}
		}
	}

	// mount svg elemnts
	var defs = svg("#svg defs");
	var arrow = defs.createPath();
	arrow.move(-3, -8);
	arrow.line(3, -8);
	arrow.line(0, 0);
	arrow.close();
	defs.path(arrow, { id: "mark-arrow" });


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

	$("#criterion-canvas").hide();
	$("#sample-canvas").hide();


	$("#playing-sample").click(function() {
		var button = $(this);
		var playing = button.hasClass("playing");

		if (playing) {
			pauseSamplePlay();
			button.removeClass("playing");
		}
		else {
			resumeSamplePlay();
			button.addClass("playing");
		}
	});


	// scroll sample canvas
	var canvasWidth = Config.KeyWidth * (pitchToX(PianoConfig.PitchEnd) + 1);
	var canvasHeight = Config.SampleCanvasLength * Config.ScoreHeightScale + 2400;
	$("#sample-canvas").attr("viewBox", "0 0 " + (canvasWidth) + " " + (canvasHeight));
	$("#sample-canvas").attr("height", canvasHeight + 2);
	var scrollHandle = setInterval(scrollSampleCanvas, 30);


	// display note evalations
	$(".note").mouseenter(function() {
		if ($("#status-bar").hasClass("playing"))
			return;

		var eval = "";
		var index = $(this).data("index");
		//console.log("index:", index);
		if (index != null && window._correspondence && window._sequence) {
			var si = _correspondence[index];
			//console.log("si:", si);
			if (si != null) {
				var sn = _sequence[si];
				if (sn && sn.eval) {
					console.log("eval:", sn.eval);

					eval += "[" + index + "]: ";

					if (sn.eval.tempo_contrast != null) {
						var percent = (Math.abs(sn.eval.tempo_contrast - 1) * 100).toPrecision(4);
						eval += "节奏" + (sn.eval.tempo_contrast > 1 ? "偏慢" : "偏快") + "<em>" + percent + "%</em>";
					}

					if (sn.eval.intensity_bias) {
						var percent = (Math.abs(sn.eval.intensity_bias) * 100).toPrecision(4);
						eval += "力度" + (sn.eval.intensity_bias > 0 ? "偏重" : "偏轻") + "<em>" + percent + "%</em>";
					}
				}
			}
		}

		$("#status-note").html(eval);
	});


	// run Follower
	Follower = new MidiMatch.Follower({
		criterionNotations: criterionNotations,
		markNotePair: markNotePair,
		unmarkNotePair: unmarkNotePair,
		clearNoteMarks: clearNoteMarks,
		onUpdateCriterionPositionByIndex: updateCriterionPositionByIndex,
		markNotePressed: markNotePressed,
		onSequenceFinished: function(sequence, path) {
			var result = evaluateNotations(criterionNotations, {notes: sequence}, path);
			//console.log(result);

			window._sequence = sequence;
			window._correspondence = MidiMatch.pathToCorrespondence(path);

			for (var i in path) {
				if (sequence[i])
					sequence[i].c_index = path[i];
			}

			paintEvaluation(result);
		},
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


	// shortcuts
	$(document).keydown(function () {
	    //console.log(event.keyCode);
	    var unhandled = false;
	    switch (event.keyCode) {
	        case 32:	// Space
	            $("#playing-sample").click();

	            break;
	        case 36:	// Home
	            updateCriterionPositionByIndex(0);
	           	Follower.clearWorkSequence();
				setProgressLine(0);

				sampleCursorIndex = 0;
				samplePlaying = false;

	            break;
	        case 35:	// End

	            break;
			case 9:		// Tab
				tabPlaySample();

				break;
	        default:
	            //console.log("unhandled key:", event.keyCode);
	            unhandled = true;
	    }

	    if (!unhandled)
	        event.preventDefault();
	});
};
