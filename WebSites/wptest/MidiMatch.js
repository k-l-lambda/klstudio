
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

    if (Math.abs(high.value - low.value) < Config.ContextRegressionEnd)
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
};

MidiMatch.Node.prototype.totalCost = function () {
	var cost = this.selfCost;

	if (this.prev)
		cost += this.prev_cost;
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

MidiMatch.Node.prototype.includsCIndex = function (index) {
	if (this.path_list)
		return this.path_list.includes(index);

	if (this.c_note && this.c_note.index == index)
		return true;

	if (this.prev)
		return this.prev.includsCIndex(index);

	return false;
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
		cost += bias * bias;

        //if (debug)
        //    console.log("evaluateConnectionCost.4");
	}

	if(cost > end_limit)
		return cost;

    //if (debug)
    //    console.log("evaluateConnectionCost.5", prev.includsCIndex(current_c.index));

    if (prev && prev.includsCIndex(current_c.index)) {
        cost += Config.RepeatConnectionCost;

        //if (debug)
        //    console.log("evaluateConnectionCost.6");
    }

	var last_c_index = prev.lastCIndex();

	for (var i = prev_c.index + 1; i < current_c.index; ++i) {
		if (i > last_c_index) {
			var note = this.criterion.notes[i];
			var bias = (current_c.start - note.start) / Config.ConnectionBiasCostBenchmark;
			cost += bias * bias;

            //if (debug)
            //    console.log("evaluateConnectionCost.7");

			if(cost > end_limit)
				return cost;
		}
	}

    //if (debug)
    //    console.log("evaluateConnectionCost.8");

	return cost;
};

MidiMatch.Node.prototype.evaluateConnection = function (prev) {
	var prev_total_cost = prev.totalCost();

	var end_limit = this.prev_cost ? this.prev_cost - prev_total_cost : null;
	if (end_limit < 0)
		return;

	var connect_cost = this.evaluateConnectionCost(prev, end_limit);
	var prev_cost = prev_total_cost + connect_cost;

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


MidiMatch.makeMatchNodes = function (note, criterion, adviceIndex) {
    note.matches = [];

	var targetList = criterion.pitchMap[note.pitch];
	if (targetList) {
		//var max_matching = 0;

		for (var ii in targetList) {
			var node = new MidiMatch.Node(targetList[ii], note, criterion, adviceIndex);

			//max_matching = Math.max(max_matching, node.matching.value);

			//if (node.matching.value > 0)
				note.matches.push(node);
		}

		/*note.matches = note.matches.filter(function(m) {
			return m.matching.value >= max_matching * Config.MatchingThreshold;
		});*/
	}

	/*note.matches.sort(function(m1, m2) {
		return m2.matching.value - m1.matching.value;
	});*/

	note.matches.push(new MidiMatch.Node(null, note, criterion, adviceIndex));
};
