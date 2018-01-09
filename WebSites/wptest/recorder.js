
Date.prototype.format = function (format) {
    /*
    * eg:format="yyyy-MM-dd hh:mm:ss";
    */
    var o = {
        "M+": this.getMonth() + 1,  //month
        "d+": this.getDate(),     //day
        "h+": this.getHours(),    //hour
        "m+": this.getMinutes(),  //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    };

    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
};


var MidiTimeStampOffset = 0;

var Recorder = function (options) {
    options = options || {};

    this.Recording = false;
    this.Waiting = false;
    this.ButtonFlickerHandle = null;
    //this.AnimationHandle = null;
    this.BeginTime = Date.now();
    this.Data = null;

    this.onNoteCreated = options.onNoteCreated;

    if (options.on)
        this.toggleRecord();
};


Recorder.MidiMetaData = {
    ticksPerBeat: 96,
    microsecondsPerBeat: 500000
};
Recorder.MidiMetaData.secondToTicks = Recorder.MidiMetaData.ticksPerBeat * 1000 / Recorder.MidiMetaData.microsecondsPerBeat;

Recorder.prototype.toggleRecord = function () {
    this.Recording = !this.Recording;

    if (this.Recording)
        this.prepareRecord();
    else
        this.endRecord();
};

Recorder.prototype.isRecording = function () {
    return this.Recording;
};

Recorder.prototype.prepareRecord = function (note) {
    MIDI.Player.stop();
    MIDI.Player.clearAnimation();

    /*updatePlayButton();

    $("#playback").addClass("recording");
    $("#score-music").empty();
    $("#playback-source").empty();*/

    this.Waiting = this.Recording;
    /*this.ButtonFlickerHandle = setInterval(function () {
        if ($("#playback-record").hasClass("fade"))
            $("#playback-record").removeClass("fade");
        else
            $("#playback-record").addClass("fade");
    }, 400);

    $("#playback-time-text").text(toMinutesSeconds(0));

    $("#playback-record").attr("title", "Finish Record (Esc)");*/

    //resetRangeMask();

    //this.SvgScore = svg("#score-music");
    //this.SvgChannel = svg(this.SvgScore.group({ class: "channel-container" }));
    //this.SvgChannels = {};
    //this.SvgPedals = svg(this.SvgScore.group({ class: "pedals" }));

    this.ChannelStatus = [];
    this.PedalStatus = {};

    this.Tracks = [[]];
    this.Tracks[0].push({ time: 0, type: "meta", subtype: "marker", text: "K.L. Studio, url:" + location.href });
    this.Tracks[0].push({ time: 0, type: "meta", subtype: "copyrightNotice", text: "K.L. Piano Trainer record at " + new Date().format("yyyy-MM-dd hh:mm") });
    this.Tracks[0].push({ time: 0, type: "meta", subtype: "timeSignature", numerator: 4, denominator: 4, thirtyseconds: 8 });
    this.Tracks[0].push({ time: 0, type: "meta", subtype: "setTempo", microsecondsPerBeat: Recorder.MidiMetaData.microsecondsPerBeat });

    //Fll.stop();
};

Recorder.prototype.beginRecord = function (timeStamp) {
    this.Waiting = false;

    //clearInterval(this.ButtonFlickerHandle);
    //this.ButtonFlickerHandle = null;

    //$("#playback-record").removeClass("fade");

    this.BeginTime = timeStamp ? (timeStamp * 1000 + MidiTimeStampOffset) : Date.now();

    //var self = this;
    //this.AnimationHandle = setInterval(function () { self.onAnimation(); }, 30);

    this.Data = [];
};

Recorder.prototype.endRecord = function () {
    //$("#playback").removeClass("recording");

    //$("#playback-record").attr("title", "Record (F9)");

    /*if (this.ButtonFlickerHandle) {
        clearInterval(this.ButtonFlickerHandle);
        this.ButtonFlickerHandle = null;
    }*/

    /*if (this.AnimationHandle) {
        clearInterval(this.AnimationHandle);
        this.AnimationHandle = null;
    }*/

    this.saveData();

    Fll.start();
};

Recorder.prototype.saveData = function () {
    var header = { formatType: 0, ticksPerBeat: Recorder.MidiMetaData.ticksPerBeat };

    this.Tracks[0].push({ time: this.elapsedTime(), type: "meta", subtype: "endOfTrack" });

    // compute deltaTime for events
    this.Tracks[0].sort(function (e1, e2) { return e1.time - e2.time; });
    //console.log("saveData", this.Tracks[0]);
    for (var i in this.Tracks[0]) {
        this.Tracks[0][i].deltaTime = (this.Tracks[0][i].time - (i > 0 ? this.Tracks[0][i - 1].time : 0)) * Recorder.MidiMetaData.secondToTicks;
    }

    var midiData = OMidiFile(header, this.Tracks);

    MetaData = {};
    updateMetaData();

    localStorage.SourceData = "data:audio/mid;base64," + btoa(midiData);
    localStorage.SourceName = "Recording " + new Date().format("yyyy-MM-dd hh.mm.ss.mid");
    MIDI.Player.loadFile(localStorage.SourceData, function () {
        MIDI.Player.currentTime = 0;

        paintScore();
        updateScorePosition();
        updatePlaybackProgress();
    });

    /*$("#playback-source").text(localStorage.SourceName);
    $("#playback-save").attr("href", localStorage.SourceData);
    $("#playback-save").attr("download", localStorage.SourceName);

    $("#playback-source-file").val("");*/
};

Recorder.prototype.elapsedTime = function () {
    return Date.now() - this.BeginTime;
};

Recorder.prototype.getTimeStamp = function (time) {
    return (time && MidiTimeStampOffset) ? (time * 1000 + MidiTimeStampOffset - this.BeginTime) : this.elapsedTime();
}

/*Recorder.prototype.getChannel = function (channel) {
    if (this.SvgChannels[channel])
        return this.SvgChannels[channel];

    this.SvgChannels[channel] = svg(this.SvgScore.group({ class: "channel", "data-channel": channel }));

    return this.SvgChannels[channel];
};*/

Recorder.prototype.onNoteOn = function (data) {
    if (this.Recording) {
        if (this.Waiting)
            this.beginRecord(data.timeStamp);

        var now = this.getTimeStamp(data.timeStamp);

        this.ChannelStatus[data.channel] = this.ChannelStatus[data.channel] || [];
        this.ChannelStatus[data.channel][data.pitch] = { start: now, velocity: data.velocity };

        if (now < 0) {
            console.warn("minus time stamp:", now, this.elapsedTime());
            now = 0;
        }

        this.Tracks[0].push({
            time: now,
            type: "channel",
            subtype: "noteOn",
            channel: data.channel,
            noteNumber: data.pitch,
            velocity: data.velocity
        });
    }
};

Recorder.prototype.onNoteOff = function (data) {
    if (this.Recording) {
        if (this.ChannelStatus[data.channel] && this.ChannelStatus[data.channel][data.pitch]) {
            var status = this.ChannelStatus[data.channel][data.pitch];
            var now = this.getTimeStamp(data.timeStamp);

            var note = { pitch: data.pitch, start: status.start, duration: now - status.start, velocity: status.velocity };

            //var channel = this.getChannel(data.channel);
            //paintNote(note, channel);
            if (this.onNoteCreated)
                this.onNoteCreated(note);

            if (now < 0) {
                console.warn("minus time stamp:", now, this.elapsedTime());
                now = 0;
            }

            this.Tracks[0].push({
                time: now,
                type: "channel",
                subtype: "noteOff",
                channel: data.channel,
                noteNumber: data.pitch,
                velocity: 0
            });
        }
    }
};

Recorder.prototype.onPedalOn = function (data) {
    if (this.Recording) {
        if (data.channel == 1) {
            if (this.Waiting)
                this.beginRecord(data.timeStamp);

            if (!this.PedalStatus[data.pedalType]) {
                var now = this.getTimeStamp(data.timeStamp);
                this.PedalStatus[data.pedalType] = { start: now };

                if (now < 0) {
                    console.warn("minus time stamp:", now, this.elapsedTime());
                    now = 0;
                }

                this.Tracks[0].push({
                    time: now,
                    type: "channel",
                    subtype: "controller",
                    channel: data.channel,
                    controllerType: PedalControllerNumber[data.pedalType],
                    value: 127
                });
            }
        }
    }
};

Recorder.prototype.onPedalOff = function (data) {
    if (this.Recording) {
        if (data.channel == 1) {
            var status = this.PedalStatus[data.pedalType];
            if (status) {
                var now = this.getTimeStamp(data.timeStamp);

                var pedal = { start: status.start, duration: now - status.start, type: data.pedalType };
                if (pedal.duration < 0)
                    console.warn("minus pedal data:", pedal);
                //else
                //    paintPedal(pedal, this.SvgPedals);

                this.PedalStatus[data.pedalType] = null;

                if (now < 0) {
                    console.warn("minus time stamp:", now, this.elapsedTime());
                    now = 0;
                }

                this.Tracks[0].push({
                    time: now,
                    type: "channel",
                    subtype: "controller",
                    channel: data.channel,
                    controllerType: PedalControllerNumber[data.pedalType],
                    value: 0
                });
            }
        }
    }
};

/*Recorder.prototype.onAnimation = function () {
    //$("#playback-time-text").text(toMinutesSeconds(this.elapsedTime()));

    updateScorePosition(this.elapsedTime());
};*/
