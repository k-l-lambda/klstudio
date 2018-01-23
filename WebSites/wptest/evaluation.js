
var ContextRange = 16;   // how many beats, the long term note context contains


var distributePosition = function(list, val) {
    var start = list.indexOf(val);

    var end = start;
    for (var i = start + 1; i < list.length; ++i) {
        if (list[i] > val)
            break;

        end = i;
    }

    return ((start + end) / 2) / (list.length - 1);
};


var evaluateNotations = function(criterion, sample, correspondence) {
    var cindex_low = null;
    var cindex_high = null;
    var retraced_count = 0;

    var c2s = [];
    var c2s_temp = [];
    for (var i = 0; i < correspondence.length; ++i) {
        var ci = correspondence[i];
        if (ci >= 0) {
            if (c2s_temp[ci] != null && ci) {
                sample.notes[i].retraced = true;

                ++retraced_count;

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

    // tempo based on span (-16 beats, 16 beats), rate = note tempo / average tempo
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

    result.note_count = cindex_high - cindex_low + 1;

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

    result.accuracy = (1 - omit_count / (cindex_high - cindex_low + 1)) * (1 - (error_count + retraced_count) / correspondence.length);
    result.omit_note_count = omit_count;
    result.error_note_count = error_count;
    result.retraced_note_count = retraced_count;
    result.coverage = (result.note_count - omit_count) / criterion.notes.length;

    // fluency: sigmoid(tempo bias costs)
    var stuck_cost = 0;
    for (var i in sample.notes) {
        var note = sample.notes[i];

        var cost = 0;
        if (note.retraced)
            cost = 1;
        else if (note.eval.tempo_rate) {
            var latency = Math.max(Math.log(note.eval.tempo_rate), 0) * 3;
            var sl = sigmoid(latency * latency);

            cost = sl * sl;
        }

        stuck_cost += cost;
    }

    result.stuck_cost = stuck_cost;
    result.fluency = Math.max(1 - stuck_cost / (result.note_count - omit_count), 0);
    result.fluency2 = result.fluency * result.fluency;
    result.fluency3 = sigmoid(Math.max(result.note_count - omit_count - stuck_cost, 0) * 0.1 / stuck_cost);
    //result.fluency2 = 1 - sigmoid(stuck_cost / 5);

    // intensity: based on velocity histogram
    var c_vels = [];
    var s_vels = [];
    for (var i in c2s) {
        var cn = criterion.notes[i];
        var sn = sample.notes[c2s[i]];

        c_vels.push(cn.velocity);
        s_vels.push(sn.velocity);
    }

    c_vels.sort();
    s_vels.sort();

    var intensity_cost = 0;

    for (var i in c2s) {
        var cn = criterion.notes[i];
        var sn = sample.notes[c2s[i]];

        sn.eval.intensity = distributePosition(s_vels, sn.velocity);
        sn.eval.c_intensity = distributePosition(c_vels, cn.velocity);

        sn.eval.intensity_bias = sn.eval.intensity - sn.eval.c_intensity;

        intensity_cost += sn.eval.intensity_bias * sn.eval.intensity_bias;
    }

    result.intensity = 1 - intensity_cost / (result.note_count - omit_count);


    // dump
    /*console.log("average_speed_rate:", average_speed_rate);
    for (var i in sample.notes) {
        var note = sample.notes[i];
        if (note.eval.tempo_contrast)
            console.log(i, note.beats.toPrecision(4), note.eval.tempo_contrast.toPrecision(4), note.eval.speed_rate.toPrecision(4), note.eval.intensity_bias != null ? note.eval.intensity_bias.toPrecision(4) : null);
    }*/

    //console.log(sample.notes);

    return result;
};
