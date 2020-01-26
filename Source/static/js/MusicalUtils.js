
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

Musical.KeySignatureNames = [];
Musical.KeySignatureNames[0] = ["C", "a"];
Musical.KeySignatureNames[1] = ["G", "e"];
Musical.KeySignatureNames[2] = ["D", "b"];
Musical.KeySignatureNames[3] = ["A", "f\u266f"];
Musical.KeySignatureNames[4] = ["E", "c\u266f"];
Musical.KeySignatureNames[5] = ["B", "g\u266f"];
Musical.KeySignatureNames[6] = ["F\u266f", "d\u266f"];
Musical.KeySignatureNames[7] = ["C\u266f", "a\u266f"];
Musical.KeySignatureNames[-1] = ["F", "d"];
Musical.KeySignatureNames[-2] = ["B\u266d", "g"];
Musical.KeySignatureNames[-3] = ["E\u266d", "c"];
Musical.KeySignatureNames[-4] = ["A\u266d", "f"];
Musical.KeySignatureNames[-5] = ["D\u266d", "b\u266d"];
Musical.KeySignatureNames[-6] = ["G\u266d", "e\u266d"];
Musical.KeySignatureNames[-7] = ["C\u266d", "a\u266d"];

Musical.notePitch = function (note) {
	var pitch = note % Musical.GroupLen;
	if (pitch < 0)
		pitch += Musical.GroupLen;

	return pitch;
};

Musical.noteGroup = function (note) {
	return Math.floor(note / Musical.GroupLen);
};


Musical.contants = {
	log2_3: Math.log(3) / Math.log(2)
};

Musical.noteTransformers = {
	reverse: function (n) {
		return 124 - n;
	},
	log3: function (n){
		return Math.round((n - 60) * Musical.contants.log2_3 ) + 60;
	}
};
