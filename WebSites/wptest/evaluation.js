
var ContextRange = 4;   // how many beats, the long term note context contains


var evaluateNotations = function(criterion, sample, correspondence) {
    var cindex_low = null;
    var cindex_high = null;

    var c2s = [];
    var c2s_temp = [];
    for (var i = 0; i < correspondence.length; ++i) {
        var ci = correspondence[i];
        if (ci >= 0) {
            if (c2s_temp[ci] != null && ci) {
                sample.notes[i].retraced = true;

                for (var j = ci; j <= c2s_temp.length; ++j)
                    delete c2s_temp[j];
            }

            c2s[ci] = i;
            c2s_temp[ci] = i;

            if (cindex_low == null)
                cindex_low = ci;
            if (cindex_high == null)
                cindex_high = ci;

            cindex_low = Math.min(cindex_low, ci);
            cindex_high = Math.max(cindex_high, ci);
        }
    };

    cindex_low = cindex_low || 0;
    cindex_high = cindex_high || cindex_low;

    // tempo based on context (-infinity, -1/8 beats)
    for (var i in sample.notes) {
        i = Number(i);

        var note = sample.notes[i];
        note.index = i;
        note.eval = {};

        var c_index = correspondence[i];

        if (c_index >= 0) {
            var c_note = criterion.notes[c_index];
            note.beats = c_note.beats;

            for (var ii = i - 1; ii >= 0; --ii) {
                var sn = sample.notes[ii];
                var ci = correspondence[ii];
                if (ci >= 0 && ci < c_index) {
                    var cn = criterion.notes[ci];
                    if (c_note.beats - cn.beats > 1/8) {
                        note.eval.tempo = (note.start - sn.start) / (note.beats - sn.beats);

                        if (!c_note.tempo)
                            c_note.tempo = (c_note.start - cn.start) / (c_note.beats - cn.beats);

                        break;
                    }
                }

                if (sn.retraced)
                    break;
            }
        }
    }

    // tempo based on span (-4 beat, 4 beats), rate = note tempo / average tempo
    var speed_total_sum = 0;
    var c_speed_total_sum = 0;
    var speed_total_count = 0;

    for (var i in sample.notes) {
        i = Number(i);

        var note = sample.notes[i];

        if (!note.eval.tempo)
            continue;

        var context = [];
        for (var ii = i - 1; ii >= 0; --ii) {
            var sn = sample.notes[ii];

            if ((note.beats - sn.beats > ContextRange) && context.length)
                break;

            if ((note.beats - sn.beats > 1/8) && sn.eval.tempo)
                context.push(sn);

            if (sn.retraced)
                break;
        }

        for (var ii = i + 1; ii < sample.notes.length; ++ii) {
            var sn = sample.notes[ii];
            if (sn.retraced)
                break;

            if ((sn.beats - note.beats > ContextRange) && context.length)
                break;

            if ((sn.beats - note.beats > 1/8) && sn.eval.tempo)
                context.push(sn);
        }

        //note.eval.context = context;

        var weights = 0;
        var speed_sum = 0;
        var c_speed_sum = 0;
        for (var ii in context) {
            var sn = context[ii];
            var cn = criterion.notes[correspondence[sn.index]];
            var distance = Math.abs(sn.beats - note.beats) * 2 / ContextRange;
            var weight = Math.exp(-distance * distance);

            weights += weight;
            speed_sum += sn.eval.tempo * weight;
            c_speed_sum += cn.tempo * weight;
        }

        //note.eval.weights = weights;
        //note.eval.speed_sum = speed_sum;

        if (speed_sum > 0) {
            note.eval.speed = speed_sum / weights;
            note.eval.tempo_rate = note.eval.tempo / note.eval.speed;

            note.eval.c_speed = c_speed_sum / weights;
            note.eval.c_tempo_rate = criterion.notes[correspondence[i]].tempo / note.eval.c_speed;

            note.eval.tempo_contrast = note.eval.tempo_rate / note.eval.c_tempo_rate;

            speed_total_sum += note.eval.speed;
            c_speed_total_sum += note.eval.c_speed;
            ++speed_total_count;
        }
    }

    var average_speed_rate = speed_total_sum / c_speed_total_sum;

    for (var i in sample.notes) {
        var note = sample.notes[i];
        if (note.eval.speed) {
            note.eval.speed_rate = note.eval.speed / (note.eval.c_speed * average_speed_rate);
        }
    }

    var result = {};

    // fluency: sigmoid(tempo bias costs)

    // accuracy: error notes statistics
    var omit_count = 0;
    for (var i = cindex_low; i <= cindex_high; ++i) {
        if (c2s[i] == null)
            ++omit_count;
    }

    var error_count = 0;
    for (var i = 0; i < correspondence.length; ++i) {
        if (correspondence[i] < 0)
            ++error_count;
    }

    result.accuracy = (1 - omit_count / (cindex_high - cindex_low + 1)) * (1 - error_count / correspondence.length);

    // intensity: based on velocity histogram

    console.log("average_speed_rate:", average_speed_rate);
    for (var i in sample.notes) {
        var note = sample.notes[i];
        if (note.eval.tempo_contrast)
            console.log(i, note.beats.toPrecision(4), note.eval.tempo_contrast.toPrecision(4), note.eval.speed_rate.toPrecision(4));
    }

    //console.log(sample.notes);

    return result;
};
