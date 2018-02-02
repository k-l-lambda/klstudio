
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
    DistanceSigmoidFactor: 0.01,		// context compare time distance, sigmoid x units per ms
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

	SmartServiceOrigin: "http://13.13.13.83:8101",
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

				sampleMidiInfo = window.midiInfo_sp || window.midiInfo;

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
loadScript(dir + "../js/md5.js");
loadScript(dir + "MidiMatch.js");
loadScript(dir + "evaluation.js");

loadScript(dir + "../js/MIDI/inc/WebMIDIAPI.js", function() {
	loadScript(dir + "../js/MIDI/inc/Base64.js", function() {
		loadScript(dir + "../js/MIDI/inc/base64binary.js", function() {
			loadScript(dir + "../js/MIDI/inc/streamEx.js", function() {
				loadScript(dir + "../js/MIDI/inc/midifileEx.js");
			});
		});
	});
});

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
                    channels[channel].push({ pitch: pitch, start: status.start, duration: time - status.start, velocity: status.velocity, id: status.id, beats: status.beats, startTick: status.startTick, endTick: ev.tick });
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

	// setup measure notes index
	var measure_list = [];
	var last_measure = null;
	for (var t in json.measures) {
		json.measures[t].startTick = Number(t);
		json.measures[t].notes = [];

		if (last_measure)
			last_measure.endTick = json.measures[t].startTick;

		var m = json.measures[t].measure;
		measure_list[m] = measure_list[m] || [];
		measure_list[m].push(json.measures[t]);

		last_measure = json.measures[t];
	}
	last_measure.endTick = notes[notes.length - 1].endTick;
	for (var i in notes) {
		var note = notes[i];
		for (var t in json.measures) {
			var measure = json.measures[t];
			if (note.startTick >= measure.startTick && note.startTick < measure.endTick || note.endTick > measure.startTick && note.endTick <= measure.endTick)
				measure.notes.push(note);
		}
	}
	json.measure_list = measure_list;

    return { channels: channels, notes: notes, pitchMap: pitchMap, pedals: pedals, bars: bars, endTime: time, keyRange: keyRange };
};


var encodeNotationToMIDI = function(notation) {
	notation.microsecondsPerBeat = notation.microsecondsPerBeat || 500000;

	var ticksPerBeat = 96;
	var msToTicks = ticksPerBeat * 1000 / notation.microsecondsPerBeat;

	var header = { formatType: 0, ticksPerBeat: ticksPerBeat };
	var track = [];

	var startTime = notation.notes[0].start;

	track.push({ time: startTime, type: "meta", subtype: "timeSignature", numerator: 4, denominator: 4, thirtyseconds: 8 });
	track.push({ time: startTime, type: "meta", subtype: "setTempo", microsecondsPerBeat: notation.microsecondsPerBeat });

	var endTime = 0;

	for (var i in notation.notes) {
		var note = notation.notes[i];

		track.push({
			time: note.start,
			type: "channel",
			subtype: "noteOn",
			channel: note.channel,
			noteNumber: note.pitch,
			velocity: note.velocity,
		});

		endTime = Math.max(endTime, note.start);

		if (note.duration) {
			track.push({
				time: note.start + note.duration,
				type: "channel",
				subtype: "noteOff",
				channel: note.channel,
				noteNumber: note.pitch,
				velocity: 0,
			});

			endTime = Math.max(endTime, note.start + note.duration);
		}
	}

	track.push({ time: endTime + 100, type: "meta", subtype: "endOfTrack" });

	track.sort(function (e1, e2) { return e1.time - e2.time; });
	for (var i in track)
		track[i].deltaTime = (i > 0 ? (track[i].time - track[i - 1].time) : 0) * msToTicks;

	//console.log(track);

	var midiData = OMidiFile(header, [track]);

	return "data:audio/mid;base64," + btoa(midiData);
};


// reload html functions
/*window.scrollTo = function(x, y) {
	$("#svgcontainer").css({left: -x, top: -y});
};*/

var scrollViewX = function(x) {
	$("#svgcontainer").css({left: -x});
};

var getViewX = function() {
	return -$("#svgcontainer").position().left;
};

window.startScrollTo = function(x) {
	scrollViewX(x);
};

window.movePage = function(num,pagex,delta) {
	//console.log("movePage:", num, pagex, delta);
	scrollViewX(pagex);
};

/*window.turnPage = function(delta) {
	console.log("turnPage:", delta);
};*/

function currentPage() {
    for (var i = page_pos.length - 1; i >= 0; i--)
    {
        var curx=getViewX();
        var pagex=page_pos[i].x;
        if (curx>=pagex-80 && curx<pagex+300) {
            return i;
            break;
        }
    }
    return 0;
}

var showCursor = function(x,y,h, meas){
    if (window.scale) {
        x = x*window.scale
        y = y*window.scale
        h = h*window.scale
    }

    var line=meas.line;
    var linePos=window.lineoffset[line];
    if(linePos) {
        x+=linePos.x;
        y+=linePos.y;
    }

    if(linePos && line<window.lineoffset.length-1) {
        var screenw=document.body.clientWidth;
        var screenx=document.body.clientleft;
        var pagesPerScreen = 2;
        if (screenw>=1920*2){
            pagesPerScreen = 4;
        }
		var view_x = getViewX();
        if(pagesPerScreen == 4){
            if(x<view_x+screenw*0.25 || x>view_x+screenw*0.75){
                var to=0
                if(line>0){
                    linePos = window.lineoffset[line-1];
                    to=linePos.x;
                }
                scrollViewX(to);
            }
        }else {
            if(x<view_x+0 || x>view_x+screenw/2){
                var to=linePos.x;
                scrollViewX(to);
            }
        }
    }
    var elem = theProgressBarElem();
    elem.x.baseVal.value=x;
    elem.y.baseVal.value=y;
    elem.height.baseVal.value=h;
}



var svg = function (selector) {
    return new $.svg._wrapperClass($(selector)[0]);
};


var scrollSampleCanvas = function() {
    var now = new Date().getTime();

    var offsetY = now % Config.SampleCanvasLength + 1200 / Config.ScoreHeightScale;
    $("#sample-canvas").css("top", -offsetY * Config.ScoreHeightScale);
};


var findSampleNoteSegment = function(c_notes, c_range, options) {
	options = options || {};

	//console.log("findSampleNoteSegment:", c_notes, c_range);

	if (!window._sequence || !window._correspondence || !c_notes.length)
		return null;

	var c_indices = [];
	for (var i in c_notes)
		c_indices.push(c_notes[i].index);

	var segment = [];

	for (var i = c_notes.length - 1; i >= 0; --i) {
		var tail_si = _correspondence[c_notes[i].index];
		if (tail_si != null) {
			if (segment.indexOf(tail_si) >= 0)
				continue;

			var indices = [];

			for (var ii = tail_si; ii >= 0; --ii) {
				var note = _sequence[ii];
				if (c_indices.indexOf(note.c_index) >= 0)
					indices.push(ii);

				if ((note.c_index >= 0 && note.c_index < c_indices[0]) || note.retraced)
					break;
			}

			// find the longest segment
			if (indices.length > segment.length)
				segment = indices;

			//console.log("fs:", i, indices);
		}
	}

	if (segment.length > 0) {
		// calculate range
		var head = _sequence[segment[segment.length - 1]];

		// find the nearest head note
		var distance = Math.abs(criterionNotations.notes[head.c_index].startTick - c_range.start);
		for (var i = segment.length - 2; i >= 0; --i) {
			var s_note = _sequence[segment[i]];
			if (s_note.c_index >= 0) {
				var c_note = criterionNotations.notes[s_note.c_index];
				var d = Math.abs(c_note.startTick - c_range.start);
				if (d < distance) {
					head = _sequence[segment[i]];
					distance = d;
				}
			}
		}

		var tail = _sequence[segment[0]];

		var tempo_s = head.eval.tempo || 600;
		var tempo_e = tail.eval.speed || 600;

		var start_c_note = criterionNotations.notes[head.c_index];
		var startTicks = start_c_note.startTick - c_range.start;
		var padding_s = (startTicks / TICKS_PER_BEATS) * tempo_s;
		var startTime = head.start - padding_s;

		var end_c_note = criterionNotations.notes[tail.c_index];
		var endTime;
		if (end_c_note.startTick > c_range.start) {
			endTime = startTime + (tail.start - startTime) * (c_range.end - c_range.start) / (end_c_note.startTick - c_range.start);
		}
		else {
			var endTicks = c_range.end - end_c_note.startTick;
			var padding_e = (endTicks / TICKS_PER_BEATS) * tempo_e;
			endTime = tail.start + padding_e;
		}

		var range = {
			start: startTime,
			end: endTime,
		}

		var start_index = Infinity;
		var end_index = 0;
		for (var i in segment) {
			start_index = Math.min(start_index, segment[i]);
			end_index = Math.max(end_index, segment[i]);
		}

		for (var i = start_index - 1; i >= 0; --i) {
			if (_sequence[i].c_index >= 0)
				break;

			start_index = Math.min(start_index, i);
		}

		for (var i = end_index + 1; i < _sequence.length; ++i) {
			if (options.extend) {
				if (_sequence[i].start > endTime)
					break;
			}
			else {
				if (_sequence[i].c_index >= 0)
					break;
			}

			end_index = Math.max(end_index, i);
		}

		if (options.extend)
			start_index = Math.max(start_index - 20, 0);

		var notes = [];
		for (var i = start_index; i <= end_index; ++i) {
			var note = _sequence[i];
			if (note.duration) {
				var exclude = false;

				// exclude out of range notes
				if (options.extend) {
					exclude |= note.start + note.duration <= startTime;
				}
				else if (note.c_index >= 0) {
					var c_note = criterionNotations.notes[note.c_index];
					exclude |= c_note.endTick <= c_range.start;
				}

				if (!exclude)
					notes.push(_sequence[i]);
			}
		}

		//console.log(segment, padding_s, );

		return {range: range, notes: notes};
	}

	return null;
};


var VIEWER_LINE_HEIGHT = 12;
var VIEWER_SUSPEND_WIDTH = 19;

var paintMeasureRolls = function(group, notes, range, width, type, index, options) {
	var options = options || {};

	var addtion_pitches = options.addtion_pitches || {};
	options.addtion_pitches = addtion_pitches;

	var pitches = options.pitches || [];
	for (var i in notes) {
		var note = notes[i];
		if (pitches.indexOf(note.pitch) < 0) {
			pitches.push(note.pitch);

			addtion_pitches[note.pitch] = true;
		}
	}
	pitches.sort(function(a, b) {return b - a;});
	//console.log("pitches:", pitches, notes);

	var bg = svg(group.rect(-VIEWER_SUSPEND_WIDTH, 0, width + VIEWER_SUSPEND_WIDTH, pitches.length * VIEWER_LINE_HEIGHT, 0, 0, {class: "viewer-background"}));

	var mask = svg(group.mask("viwer-mask-" + index, 0, 0, width, pitches.length * VIEWER_LINE_HEIGHT, {class: "viwer-mask"}));
	mask.rect(0, 0, width, pitches.length * VIEWER_LINE_HEIGHT, 0, 0, {fill: "white"});

	// note bars
	for (var i in notes) {
		var note = notes[i];
		var line = pitches.indexOf(note.pitch);
		var start = (type == "criterion" ? note.startTick : note.start) - range.start;
		var end = (type == "criterion" ? note.endTick : note.start + note.duration) - range.start;
		var xscale = width / (range.end - range.start);

		var classes = "viewer-bar";
		if (type == "sample") {
			if (note.c_index < 0)
				classes += " error";
			else if (note.retraced)
				classes += " retraced";
			else
				classes += " fine";
		}
		else if (type == "criterion" && options.compare) {
			if (_correspondence[note.index] == null)
				classes += " omit";
			else
				classes += " fine";
		}

		//console.log("bar:", type, note, range, line, start, end, xscale);
		group.rect(start * xscale, line * VIEWER_LINE_HEIGHT + 1, (end - start) * xscale, VIEWER_LINE_HEIGHT - 2, 3, 3, {class: classes, mask: "url(#viwer-mask-" + index + ")"});
	}

	// pitch label
	for (var i in pitches) {
		i = Number(i);

		var classes = "viewer-pitch-label";
		if (options.compare && addtion_pitches[pitches[i]])
			classes += " error";
		group.text(0, (i + 1) * VIEWER_LINE_HEIGHT, Musical.PitchNames[Musical.notePitch(pitches[i])], {class: classes});
	}

	return pitches.length;
};

var showMeasureRollView = function(mm) {
	$("#measure-viewer").remove();

	var mp = meas_pos[mm];
	if (mp) {
		var transform = $("#line_" + mp.line).attr("transform");
		var viewer = svg("#wuxianpu").group({id: "measure-viewer", "data-m": mm, transform: transform});
		viewer = svg(viewer);

		var y_offset = 0;
		var tm = transform.match(/translate\([\d\.]+,\s*([\d\.]+)\)/);
		if (tm && tm[1]) {
			var ly = Number(tm[1]);
			//console.log("ly:", ly);
			if (ly > 700)
				y_offset = -ly + 300;
		}

		var index = 0;

		var has_samples = false;

		var lines = 0;

		var measure = criterionMidiInfo.measure_list[mm][0];
		var tick_range = {start: measure.startTick, end: measure.endTick};

		for (var i in criterionMidiInfo.measure_list[mm]) {
			var measure = criterionMidiInfo.measure_list[mm][i];
			var tick_range = {start: measure.startTick, end: measure.endTick};

			var ss = findSampleNoteSegment(measure.notes, tick_range, {extend: true});
			if (ss && ss.notes.length > 0) {
				var pitches = [];
				for (var i in measure.notes) {
					var note = measure.notes[i];
					if (pitches.indexOf(note.pitch) < 0)
						pitches.push(note.pitch);
				}

				var y = mp.pos.y + mp.pos.h + 30 + lines * VIEWER_LINE_HEIGHT + y_offset;

				var options = {pitches: pitches, compare: true};

				var wrapper_sample = svg(viewer.group({transform: "translate(" + mp.pos.x + "," + y + ")",
					class: "type-sample", id: "rolls-" + index}));
				lines += paintMeasureRolls(wrapper_sample, ss.notes, ss.range, mp.pos.w, "sample", index++, options) + 1;

				var wrapper_criterion = svg(viewer.group({transform: "translate(" + mp.pos.x + "," + y + ")",
					class: "type-criterion switch-2", id: "rolls-" + index}));
				paintMeasureRolls(wrapper_criterion, measure.notes, tick_range, mp.pos.w, "criterion", index++, options);

				has_samples = true;
			}
		}

		if (!has_samples) {
			var wrapper = svg(viewer.group({transform: "translate(" + mp.pos.x + "," + (mp.pos.y + mp.pos.h + 30 + y_offset) + ")", class: "type-criterion", id: "rolls-" + index}));

			paintMeasureRolls(wrapper, measure.notes, tick_range, mp.pos.w, "criterion", index++);
		}
	}
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

	$("#measure-viewer").remove();

	$(".measure-summary").removeClass("active");
	$(".measure-summary text").remove();
	$(".measure-summary").attr("style", null);
	$(".measure-summary .background").attr("style", null);
};

var paintEvaluation = function(eval) {
	// summary
    var summary = "演奏了<em>" + eval.note_count + "</em>个音符，覆盖乐谱<em>" + (eval.coverage * 100).toPrecision(4) + "%</em>，错音<em>"
        + eval.error_note_count + "</em>个，漏音<em>" + eval.omit_note_count + "</em>个，重复音<em>" + eval.retraced_note_count
        + "</em>个，正确率<em>" + (eval.accuracy * 100).toPrecision(4) + "%</em>，流畅度<em>"
        + (eval.fluency2 * 100).toPrecision(4) + ", " + (eval.fluency3 * 100).toPrecision(4) + "%</em>，力度准确性<em>" + (eval.intensity * 100).toPrecision(4) + "%</em>";
    $("#status-summary").html(summary);
	$("body").removeClass("playing");
	$("body").addClass("evaluating");

	// error note marks
	var ERROR_MARK_Y = -65;
	var ref_note = null;
	for (var i = _sequence.length - 1; i >= 0; --i) {
		var s_note = _sequence[i];

		//console.log("s:", i, s_note.c_index, s_note.eval.tempo);

		if (s_note.c_index >= 0) {
			if (s_note.eval.tempo)
				ref_note = s_note;

			// retraced note
			if (s_note.retraced) {
				var c_note = criterionNotations.notes[s_note.c_index];
				if (c_note) {
					var position = lookupScorePosition(c_note.startTick);
					var line = svg("#line_" + position.line);
					line.use(position.x, ERROR_MARK_Y, 0, 0, "#mark-arrow", {class: "mark-error retraced"});
				}
			}
		}
		else if (ref_note) {
			// error note
			var deltaBeats = (s_note.start - ref_note.start) / ref_note.eval.tempo;
			var c_note = criterionNotations.notes[ref_note.c_index];
			//console.log("em:", i, s_note, ref_note, c_note);
			if (c_note) {
				var tick = c_note.startTick + deltaBeats * TICKS_PER_BEATS;
				var position = lookupScorePosition(tick);
				//console.log("error mark:", position);

				var line = svg("#line_" + position.line);
				line.use(position.x, ERROR_MARK_Y, 0, 0, "#mark-arrow", {class: "mark-error"});
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
				else
					g.addClass("eval-fine");
            }
        }
    }

	// measure summaries
	$(".measure-summary").each(function(m, elem) {
		var mm = $(elem).data("m");
		var list = criterionMidiInfo.measure_list[mm];
		if (list && list.length) {
			var speed_sum = 0;
			var c_speed_sum = 0;
			var speed_count = 0;

			var error_count = 0;

			var mp = meas_pos[mm];

			for (var i in list) {
				var measure = list[i];

				var ss = findSampleNoteSegment(measure.notes, {start: measure.startTick, end: measure.endTick});
				if (ss) {
					for (var ii in ss.notes) {
						var note = ss.notes[ii];
						if (note.eval && note.eval.speed && note.eval.c_speed) {
							speed_sum += note.eval.speed;
							c_speed_sum += note.eval.c_speed;

							++speed_count;
						}

						if (note.c_index < 0)
							++error_count;
					}

					for (var i in measure.notes) {
						if (_correspondence[measure.notes[i].index] == null)
							++error_count;
					}
				}
			}

			if (speed_count) {
				var credit = 1;

				var average_speed = speed_sum / speed_count;
				var speed_rate = (c_speed_sum * eval.average_speed_rate) / speed_sum;

				credit *= 1 - sigmoid(Math.abs(Math.log(speed_rate)) * 2);
				//console.log("credit:", speed_rate, credit);

				var text = "速度:" + Math.round(60000 / average_speed) + "  " + (speed_rate > 1.01 ? "\u2191" : (speed_rate < 0.99 ? "\u2193" : "")) + speed_rate.toPrecision(3);

				var group = svg(elem);
				group.text(6, 20, text, {class: "measure-summary-text"});

				if (error_count) {
					credit *= 1 - sigmoid(error_count * 0.8);

					group.text(mp.pos.w - 8, 20, error_count.toString(), {class: "measure-summary-error"});
				}

				var g = Math.round(255 * credit);
				var r = Math.round(255 * (1 - credit));
				$(elem).find(".background").css("fill", "rgba(" + r + ", " + g + ", 0, 0.3)");
				$(elem).css({
					opacity: 1,
				});
			}
		}
	});
};


var initializeScoreCanvas = function() {
	var defs = svg("#svg defs");
	var arrow = defs.createPath();
	arrow.move(-3, -8);
	arrow.line(3, -8);
	arrow.line(0, 0);
	arrow.close();
	defs.path(arrow, { id: "mark-arrow" });

	$("rect[id^='m']").addClass("measure");
	$("g[id^='line_']").addClass("line");

	for (var i in meas_pos) {
		var measure = meas_pos[i];
		var line = svg("#line_" + measure.line);
		var g = svg(line.group({class: "measure-summary", "data-m": i, transform: "translate(" + measure.pos.x + "," + (measure.pos.y + measure.pos.h) + ")"}));
		g.rect(3, 0, measure.pos.w - 6, 30, 2, 2, {class: "background"});
	}

	$(".measure-summary").click(function() {
		var mm = $(this).data("m");

		$(".measure-summary.active").removeClass("active");

		var viewer = $("#measure-viewer");
		if (viewer.data("m") == mm)
			viewer.remove();
		else {
			showMeasureRollView(mm);
			$(this).addClass("active");
		}
	});

	// start phase switching
	setInterval(function() {
		window.switching_phase = window.switching_phase || 1;

		$("body").removeClass("switch-phase-" + switching_phase);

		++switching_phase;
		if (switching_phase > 2)
			switching_phase = 1;

		$("body").addClass("switch-phase-" + switching_phase);
	}, 1500);
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


var noteOn = function (data, timestamp) {
	//console.log("noteOn:", data, timestamp);

    timestamp = timestamp || Date.now();

    ChannelStatus[data.channel] = ChannelStatus[data.channel] || [];
    ChannelStatus[data.channel][data.pitch] = { start: timestamp, velocity: data.velocity, pitch: data.pitch };

    Follower.onNoteRecord(ChannelStatus[data.channel][data.pitch]);

    if (!$("body").hasClass("playing")) {
        clearEvaluation();
        $("body").addClass("playing");
		$("body").removeClass("evaluating");
    }
};

var noteOff = function (data, timestamp) {
	//console.log("noteOff:", data, timestamp);

    timestamp = timestamp || Date.now();

    var status = ChannelStatus[data.channel][data.pitch];
    if (!status)
        return;

    var note = status;
    note.duration = timestamp - status.start;

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

        if (sampleCursorIndex >= data.events.length) {
            samplePlaying = false;
			sampleCursorIndex = 0;
            return;
        }

		var deltaTicks = sampleCursorIndex <= 0 ? 0 : data.events[sampleCursorIndex].tick - data.events[sampleCursorIndex - 1].tick;

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

var pauseSamplePlay = function() {
    samplePlaying = false;
};

var resumeSamplePlay = function() {
	if (sampleCursorIndex >= sampleMidiInfo.events.length)
		sampleCursorIndex = 0;

    playSample(sampleMidiInfo);
};


var sendRecording = function() {
	$.post(Config.SmartServiceOrigin + "/upload-recording", {
		title: criterionMidiInfo.title || "",
		criterion_id: md5(JSON.stringify(criterionMidiInfo)),
		sample: encodeNotationToMIDI({notes: _sequence}),
	}, function(response, status, xhr) {
		console.log("recording uploaded:", response);
	}, "json");
};



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
	initializeScoreCanvas();


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
		if ($("body").hasClass("playing"))
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

			sendRecording();
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

				scrollViewX(0);

	            break;
	        case 35:	// End

	            break;
			case 33:	// PageUp
				turnPage(-1);

				break;
			case 34:	// PageDown
				turnPage(1);

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
