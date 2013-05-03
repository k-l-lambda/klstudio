
var Musical = Musical || {};


Musical.GroupLen = 12;

Musical.DiatonicScales = {
	Major: {
		MainPitches: { 0: true, 2: true, 4: true, 5: true, 7: true, 9: true, 11: true },
		SyllableNames: ["do", null, "re", null, "mi", "fa", null, "so", null, "la", null, "si"]
	},
	Minor: {
		MainPitches: { 0: true, 2: true, 3: true, 5: true, 7: true, 8: true, 11: true },
		SyllableNames: ["do", null, "re", "mi", null, "fa", null, "so", "la", null, null, "si"]
	}
};

Musical.notePitch = function (note) {
	var pitch = note % Musical.GroupLen;
	if (pitch < 0)
		pitch += Musical.GroupLen;

	return pitch;
};

Musical.noteGroup = function (note) {
	return Math.floor(note / Musical.GroupLen);
};
