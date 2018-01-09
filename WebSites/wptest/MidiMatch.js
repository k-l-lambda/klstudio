
var MidiMatch = MidiMatch || {};


MidiMatch.genNoteContext = function (notation, index) {
    index = Number(index);

    var left = index;
    var right = index;

    var note = notation.notes[index];

    for (var i = index - 1; i >= 0; --i) {
        var n = notation.notes[i];
        if (left < index && n.start - note.start < Config.ContextSpan.left)
            break;

        left = i;
    }

    for (var i = index + 1; i < notation.notes.length; ++i) {
        var n = notation.notes[i];
        if (right > index && n.start - note.start > Config.ContextSpan.right)
            break;

        right = i;
    }

    note.context = [];

    for (var i = left; i <= right; ++i) {
        if (i != index) {
            var n = notation.notes[i];
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
        MidiMatch.genNoteContext(notation, i);
};
