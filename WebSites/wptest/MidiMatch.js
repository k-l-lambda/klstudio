
var MidiMatch = MidiMatch || {};



var sigmoid = function (x) {
	return (1 - Math.exp(-x)) / (1 + Math.exp(-x));
};


MidiMatch.genNoteContext = function (notes, index) {
    index = Number(index);

    var left = index;
    var right = index;

    var note = notes[index];

    for (var i = index - 1; i >= 0; --i) {
        var n = notes[i];
        if (left < index && n.start - note.start < Config.ContextSpan.left)
            break;

        left = i;
    }

    for (var i = index + 1; i < notes.length; ++i) {
        var n = notes[i];
        if (right > index && n.start - note.start > Config.ContextSpan.right)
            break;

        right = i;
    }

    note.context = [];

    for (var i = left; i <= right; ++i) {
        if (i != index) {
            var n = notes[i];
            var d_pitch = n.pitch - note.pitch;
            var d_time = Math.floor(n.start - note.start);

            if (d_time > 0)
                d_pitch += 1000;

            if(note.context[d_pitch] == null || Math.abs(d_time) < Math.abs(note.context[d_pitch]))
                note.context[d_pitch] = d_time;
        }
    }
};


MidiMatch.genNotationContext = function (notation) {
    for (var i in notation.notes)
        MidiMatch.genNoteContext(notation.notes, i);
};


MidiMatch.compareContexts = function (criterion, sample, scale) {
    var match = 0;

    for (var pitch in criterion) {
        var pc = criterion[pitch];

        pitch = Number(pitch);

        if (pitch > 800)
            pitch -= 1000;

        var ps1 = sample[pitch];
        var ps2 = sample[pitch + 1000];

        var distance = null;

        if (ps1 != null)
            distance = Math.abs(pc - ps1 * scale);

        if (ps2 != null) {
            var d2 = Math.abs(pc - ps2 * scale);
            if (distance != null)
                distance = Math.min(distance, d2);
            else
                distance = d2;
        }

        if (distance != null) {
            var increase = 1 - sigmoid(distance * Config.DistanceSigmoidFactor);
            match += increase;

            /*if (isNaN(increase)) {
                console.error("error increase:", criterion, sample, scale, pitch, distance, pc, ps1, ps2);
                throw "error increase";
            }*/
        }
    }

    return match;
};

MidiMatch.compareContextsDerivation = function (criterion, sample, scale, ds) {
    var v0 = MidiMatch.compareContexts(criterion, sample, scale);
    var v1 = MidiMatch.compareContexts(criterion, sample, scale + Math.min(Config.ContextRegressionDiffer, ds));

    var derivation = (v1 - v0) / Config.ContextRegressionDiffer;

    return { value: v0, derivation: derivation };
};

MidiMatch.compareContextsInRange = function (criterion, sample, low, high) {
    var better = high.value > low.value ? high : low;
    var worse = high.value > low.value ? low : high;

    if (Math.abs(high.value - low.value) < Config.ContextRegressionEnd && Math.abs(high.scale - low.scale) < 0.1)
        return better;

    var middle_scale = Math.sqrt(low.scale * high.scale);
    var middle_result = MidiMatch.compareContextsDerivation(criterion, sample, middle_scale, middle_scale - low.scale);

    //console.log("middle:", middle_scale, middle_result.value, middle_result.derivation);

    //console.assert(middle_result.value >= worse.value, "concave match curve: ", criterion, sample, low, high);

    if (middle_result.derivation > 0)
        return MidiMatch.compareContextsInRange(criterion, sample, { scale: middle_scale, value: middle_result.value }, high);
    else
        return MidiMatch.compareContextsInRange(criterion, sample, low, { scale: middle_scale, value: middle_result.value });
};

MidiMatch.compareContextsRegression = function (criterion, sample) {
    var low = {
        scale: 1 / Config.ContextRegressionBegin,
        value: MidiMatch.compareContexts(criterion, sample, 1 / Config.ContextRegressionBegin),
    };
    var high = {
        scale: Config.ContextRegressionBegin,
        value: MidiMatch.compareContexts(criterion, sample, Config.ContextRegressionBegin),
    };

    return MidiMatch.compareContextsInRange(criterion, sample, low, high);
};


MidiMatch.Node = function (c_note, s_note, criterion, adviceIndex) {
	this.c_note = c_note;
	this.s_note = s_note;

	this.selfCost = 0;

    this.criterion = criterion;
    this.adviceIndex = adviceIndex;

    this.hesitate = 1;
};

MidiMatch.Node.prototype.totalCost = function () {
	var cost = this.selfCost;

	if (this.prev)
		cost += this.prev_cost * Config.StepDecay;
    else {
        if (this.adviceIndex >= 0) {
            var offset = this.c_note ? sigmoid(Math.abs(this.c_note.index - this.adviceIndex) * 0.2) : 1;
            cost += offset * Config.StartPositionOffsetCost;
        }
    }

	if (isNaN(cost)) {
		console.log("NaN cost:", this);
		throw "NaN";
	}

	return cost;
};

MidiMatch.Node.prototype.evaluateMatchingCost = function () {
	if (this.c_note)
        this.matching = MidiMatch.compareContextsRegression(this.c_note.context, this.s_note.context);
        //this.matching = {value: 10};
	else
		this.matching = {value: 0};

	this.selfCost = 1 - sigmoid(this.matching.value);
};

MidiMatch.Node.prototype.lastCNote = function () {
	if (this.c_note)
		return this.c_note;

	if (this.prev)
		return this.prev.lastCNote();

	return -1;
};

/*MidiMatch.Node.prototype.includsCIndex = function (index) {
	if (this.path_list)
		return this.path_list.includes(index);

	if (this.c_note && this.c_note.index == index)
		return true;

	if (this.prev)
		return this.prev.includsCIndex(index);

	return false;
};*/

MidiMatch.Node.prototype.includsCIndexCost = function (index) {
	if (this.path_list)
		return this.path_list.includes(index);

	if (this.c_note && this.c_note.index == index)
		return Config.RepeatConnectionCost;

    if (this.repeated)
        return 0;

	if (this.prev)
		return this.prev.includsCIndexCost(index) * Config.StepDecay;

	return 0;
};

MidiMatch.Node.prototype.lastCIndex = function () {
	if (this.last_c_index)
		return this.last_c_index;

	var index = this.c_note ? this.c_note.index : -1;
	if (this.prev)
		index = Math.max(index, this.prev.lastCIndex());

	return index;
};

MidiMatch.Node.prototype.evaluateConnectionCost = function (prev, end_limit, debug) {
    if (end_limit == null)
        end_limit = Infinity;

	var prev_c = prev.lastCNote();
	var current_c = this.c_note;

    //if (debug)
    //    console.log("evaluateConnectionCost.1");

	if (!current_c)
		return Config.NullConnectionCost;

    //if (debug)
    //    console.log("evaluateConnectionCost.2", current_c.index);

	if (!prev_c)
		return 0;

    //if (debug)
    //    console.log("evaluateConnectionCost.3");

	var cost = 0;

	if (current_c.index < prev_c.index) {
		var bias = (prev_c.start - current_c.start) / Config.ConnectionBiasCostBenchmark;
		cost += (bias * bias);

        //if (debug)
        //    console.log("evaluateConnectionCost.4", cost);
	}

	if(cost > end_limit)
		return cost;

    //if (debug)
    //    console.log("evaluateConnectionCost.5", prev.includsCIndex(current_c.index));

    if (prev) {
        cost += prev.includsCIndexCost(current_c.index);

        //if (debug)
        //    console.log("evaluateConnectionCost.6", cost);
    }

	var last_c_index = prev.lastCIndex();

	for (var i = prev_c.index + 1; i < current_c.index; ++i) {
		if (i > last_c_index) {
			var note = this.criterion.notes[i];
			var bias = (current_c.start - note.start) / Config.ConnectionBiasCostBenchmark;
			cost += (bias * bias);

            //if (debug)
            //    console.log("evaluateConnectionCost.7", cost);

			if(cost > end_limit)
				return cost;
		}
	}

    //if (debug)
    //    console.log("evaluateConnectionCost.8", cost);

	return cost;
};

MidiMatch.Node.prototype.evaluateConnection = function (prev) {
	var prev_total_cost = prev.totalCost();

	var end_limit = this.prev_cost ? this.prev_cost - prev_total_cost : null;
	if (end_limit < 0)
		return;

	var connect_cost = this.evaluateConnectionCost(prev, end_limit);
	var prev_cost = prev_total_cost + connect_cost / this.hesitate;

	//if (prev.c_note && prev.c_note.fixed)
	//	prev_cost += Config.NullConnectionCost;

	if (this.prev == null || this.prev_cost > prev_cost) {
		this.prev = prev;
		this.prev_cost = prev_cost;
		this.connect_cost = connect_cost;
	}

	//prev.next_connect_costs = prev.next_connect_costs || [];
	//prev.next_connect_costs.push(connect_cost);
};

MidiMatch.Node.prototype.path = function () {
	var indices = this.prev ? this.prev.path() : [];

	if (this.c_note)
		indices.push(this.c_note.index);
	else
		indices.push(-1);

	return indices;
};


MidiMatch.makeMatchNodes = function (note, criterion, adviceIndex, lastNote) {
    note.matches = [];

	var targetList = criterion.pitchMap[note.pitch];
	if (targetList) {
        var hesitate = 1;
        if (lastNote)
            hesitate = Math.exp(Math.pow((note.start - lastNote.start) / Config.HesitateIntervalBenchmark, 2));

		for (var ii in targetList) {
			var node = new MidiMatch.Node(targetList[ii], note, criterion, adviceIndex);
            node.hesitate = hesitate;

			note.matches.push(node);
		}
	}

	note.matches.push(new MidiMatch.Node(null, note, criterion, adviceIndex));
};



MidiMatch.pathToCorrespondence = function(path) {
    var result = [];

    for (var i in path) {
        var ci = path[i];
        if (ci >= 0)
            result[ci] = Math.max(i, result[ci] || i);
    };

    return result;
};



MidiMatch.Follower = function(options) {
    options = options || {};

    this.criterionNotations = options.criterionNotations;

    this.noteStartTimeOffset = options.noteStartTimeOffset || function() {return 0;};

    this.updateInterval = options.updateInterval || 50;

    this.markNotePair = options.markNotePair;
    this.unmarkNotePair = options.unmarkNotePair;
    this.clearNoteMarks = options.clearNoteMarks;
    this.markNotePressed = options.markNotePressed;
    this.onUpdateCriterionPositionByIndex = options.onUpdateCriterionPositionByIndex;
    this.onSequenceFinished = options.onSequenceFinished

    this.setActive(true);

    this.PressedIndices = [];
};


MidiMatch.Follower.prototype.Sequence = [];
MidiMatch.Follower.prototype.WorkingIndex = 0;
MidiMatch.Follower.prototype.Path = [];
MidiMatch.Follower.prototype.CeriterionIndex = 0;


MidiMatch.Follower.prototype.setActive = function(active) {
    this.active = active;

    if (this.updateHandle) {
        clearInterval(this.updateHandle);
        this.updateHandle = null;
    }

    var self = this;

    if (this.active)
        this.updateHandle = setInterval(function() {
            self.updateSequence();
        }, this.updateInterval);
};


MidiMatch.Follower.prototype.matchNote = function(index) {
    var note = this.Sequence[index];
    if (!note)
        return;

    MidiMatch.genNoteContext(this.Sequence, index);

    var second_best_node = note.matches[1] || note.matches[0];
    var second_best_node_cost = second_best_node.totalCost();

    var endNode = new MidiMatch.Node();

    var next_note = this.Sequence.length > index + 1 ? this.Sequence[index + 1] : null;

    for (var ii in note.matches) {
        var node = note.matches[ii];
        if (node.totalCost() - second_best_node_cost < 1 || ii < Config.ConnectionClipIndex) {
            node.evaluateMatchingCost();

            if (node.prev && node.c_note)
                node.repeated = node.prev.includsCIndexCost(node.c_note.index) > 0;

            if (next_note) {
                 for (var i in next_note.matches)
                    next_note.matches[i].evaluateConnection(node);

            }
            else {
                endNode.evaluateConnection(node);
            }
        }
    }

    if (next_note) {
        next_note.matches = next_note.matches.sort(function(n1, n2) {
            return n1.totalCost() - n2.totalCost();
        });

        endNode = next_note.matches[0];
    }

    var c_index = endNode.prev.c_note ? endNode.prev.c_note.index : -1;
    //console.log("match:", index, c_index, endNode.prev.totalCost());

    var duplicated = false;

    if (c_index >= 0) {
        if (this.markNotePair)
            this.markNotePair(c_index, index);

        this.CeriterionIndex = c_index + 1;

        var elapsed = Date.now() - (note.start + this.noteStartTimeOffset());
        if (this.onUpdateCriterionPositionByIndex)
            this.onUpdateCriterionPositionByIndex(c_index, elapsed);

        // trim PressedIndices
        var press_index = this.PressedIndices.indexOf(c_index);
        if (press_index > 10)	// 1o notes at most may pressed simultaneously
            this.PressedIndices.splice(0, press_index - 10);
    }

    note.matched = true;
    note.c_index = c_index;

    if (note.graph) {
        $(note.graph.group).addClass("matched");

        $(note.graph.group).addClass(c_index >= 0 ? (duplicated ? "duplicated" : "paired") : "unpaired");
    }


    var path = endNode.prev.path();
    for (var i = this.Path.length - 1; i >= 0; --i) {
        if (this.Path[i] == path[i])
            break;

        //console.log("path change:", i, path[i]);

        if (this.Path[i] >= 0 && this.unmarkNotePair)
            this.unmarkNotePair(this.Path[i]);
        if (path[i] >= 0 && this.markNotePair)
            this.markNotePair(path[i], i);

        this.PressedIndices = [];
    }

    this.Path = path;
};


MidiMatch.Follower.prototype.onNoteRecord = function(note) {
    MidiMatch.makeMatchNodes(note, this.criterionNotations, this.CeriterionIndex, this.Sequence[this.Sequence.length - 1]);
    this.Sequence.push(note);

    var lastNote = this.Sequence[this.Sequence.length - 2];
    if (lastNote && lastNote.matched)
        this.matchNote(this.Sequence.length - 2);

    // find pressed note
    if (this.markNotePressed) {
        var plist = this.criterionNotations.pitchMap[note.pitch];
        var pressed = null;
        for (var i in plist) {
            var n = plist[i];
            if (n.index >= this.CeriterionIndex && this.PressedIndices.indexOf(n.index) < 0) {
                pressed = n.index;
                break;
            }
        }

        if (pressed != null) {
            this.PressedIndices.push(pressed);

            this.markNotePressed(pressed);
        }
    }
};


MidiMatch.Follower.prototype.clearWorkSequence = function() {
    if (this.Sequence.length > 0) {
        if (this.onSequenceFinished)
            this.onSequenceFinished(this.Sequence, this.Path);
    }

    this.Sequence = [];
    this.WorkingIndex = 0;
    this.Path = [];
    this.PressedIndices = [];

    if (this.clearNoteMarks)
        this.clearNoteMarks();

    console.log("Sequence reset.");
};


MidiMatch.Follower.prototype.updateSequence = function() {
    var now = new Date().getTime();

    while (this.Sequence.length > this.WorkingIndex) {
        var note = this.Sequence[this.WorkingIndex];

        if (now - (note.start + this.noteStartTimeOffset()) > Config.PendingLatency) {
            this.matchNote(this.WorkingIndex);
            this.WorkingIndex++;
        }
        else
            break;
    }

    var tail = this.Sequence[this.Sequence.length - 1];
    if (tail && now - (tail.start + this.noteStartTimeOffset()) > Config.SequenceResetInterval) {
        this.Correspondence = MidiMatch.pathToCorrespondence(this.Path);
        //console.log("Correspondence:", this.Correspondence);
        if (this.Correspondence[this.criterionNotations.notes.length - 1] != null) {
            this.CeriterionIndex = 0;
            if (this.onUpdateCriterionPositionByIndex)
                this.onUpdateCriterionPositionByIndex(0);
        }

        this.clearWorkSequence();
    }
};


MidiMatch.Follower.prototype.dumpSampleNote = function(index) {
    var note = this.Sequence[index];
    if (note) {
        for (var i in note.matches) {
            var node = note.matches[i];
            var c_index = node.c_note ? node.c_note.index : -1;

            console.log(c_index, node.totalCost(), node);
        }
    }
};


MidiMatch.Follower.prototype.debugMatchNote = function(index) {
    var note = this.Sequence[index];
    if (!note)
        return;

    MidiMatch.genNoteContext(this.Sequence, index);

    var second_best_node = note.matches[1] || note.matches[0];
    var second_best_node_cost = second_best_node.totalCost();

    var next_note = this.Sequence[index + 1];
    //var next_c_index = next_note.matches[0].c_note ? next_note.matches[0].c_note.index : -1;
    var next_c_index = this.Path[index + 1];

    MidiMatch.makeMatchNodes(next_note, this.criterionNotations, next_note.matches[0].adviceIndex, this.Sequence[index]);

    var next_node = null;
    for (var i in next_note.matches) {
        var ci = next_note.matches[i].c_note ? next_note.matches[i].c_note.index : -1;
        if (ci == next_c_index) {
            next_node = next_note.matches[i];
            break;
        }
    }

    for (var ii in note.matches) {
    	var node = note.matches[ii];
    	if (node.totalCost() - second_best_node_cost < 1 || ii < Config.ConnectionClipIndex) {
            node.evaluateMatchingCost();

            var cc = next_node.evaluateConnectionCost(node, null, true);

			next_note.matches[i].evaluateConnection(node);

            console.log("match cost:", ii, cc, node, next_node);
    	}
    }

    if (next_note.matches[0].prev) {
        var c_index = next_note.matches[0].prev.c_note ? next_note.matches[0].prev.c_note.index : -1;
        console.log("match:", index, c_index);
    }

    window.next_node = next_node;
};
