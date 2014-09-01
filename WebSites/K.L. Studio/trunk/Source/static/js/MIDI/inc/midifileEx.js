/*
class to encode the .mid file format
(depends on streamEx.js)
*/
function OMidiFile(header, tracks) {
	function writeChunk(stream, id, data) {
		console.assert(id.length == 4, "chunk id must be 4 byte");

		stream.write(id);
		stream.writeInt32(data.length);
		stream.write(data);
	}

	function writeEvent(stream, event) {
		//stream.writeVarInt(event.deltaTime);

		switch (event.type) {
			case "meta":
				//stream.writeInt8(0xff);

				break;
			case "sysEx":
				//stream.writeInt8(0xf0);

				break;
			case "dividedSysEx":
				//stream.writeInt8(0xf7);

				break;
			case "channel":
				switch (event.subtype) {
					case "noteOn":
						stream.writeVarInt(event.deltaTime);

						stream.writeInt8(0x90 | event.channel);
						stream.writeInt8(event.noteNumber);
						stream.writeInt8(event.velocity);

						break;
					case "noteOff":
						stream.writeVarInt(event.deltaTime);

						stream.writeInt8(0x80 | event.channel);
						stream.writeInt8(event.noteNumber);
						stream.writeInt8(event.velocity ? event.velocity : 0);

						break;
					case "noteAftertouch":
						break;
					case "controller":
						break;
					case "programChange":
						break;
					case "channelAftertouch":
						break;
					case "pitchBend":
						break;
				}

				break;
		}
	}

	var stream = OStream();

	var headerChunk = OStream();
	headerChunk.writeInt16(header.formatType);
	headerChunk.writeInt16(tracks.length);
	headerChunk.writeInt16(header.ticksPerBeat);

	writeChunk(stream, "MThd", headerChunk.getBuffer());

	for (var i = 0; i < tracks.length; ++i) {
		var trackChunk = OStream();

		for (var ei = 0; ei < tracks[i].length; ++ei) {
			writeEvent(trackChunk, tracks[i][ei]);
		}

		writeChunk(stream, "MTrk", trackChunk.getBuffer());
	}

	return stream.getBuffer();
}
