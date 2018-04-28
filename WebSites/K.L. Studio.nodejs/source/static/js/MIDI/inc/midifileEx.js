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
		if (event.subtype == "unknown")
			return;

		stream.writeVarInt(event.deltaTime);

		switch (event.type) {
			case "meta":
				stream.writeInt8(0xff);

				switch (event.subtype) {
					case "sequenceNumber":
						stream.writeInt8(0x00);
						stream.writeVarInt(2);

						stream.writeInt16(event.number);

						break;
					case "text":
						stream.writeInt8(0x01);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "copyrightNotice":
						stream.writeInt8(0x02);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "trackName":
						stream.writeInt8(0x03);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "instrumentName":
						stream.writeInt8(0x04);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "lyrics":
						stream.writeInt8(0x05);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "marker":
						stream.writeInt8(0x06);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "cuePoint":
						stream.writeInt8(0x07);
						stream.writeVarInt(event.text.length);

						stream.write(event.text);

						break;
					case "midiChannelPrefix":
						stream.writeInt8(0x20);
						stream.writeVarInt(1);

						stream.writeInt8(event.channel);

						break;
					case "endOfTrack":
						stream.writeInt8(0x2f);
						stream.writeVarInt(0);

						break;
					case "setTempo":
						stream.writeInt8(0x51);
						stream.writeVarInt(3);

						stream.writeInt8((event.microsecondsPerBeat >> 16) & 0xff);
						stream.writeInt8((event.microsecondsPerBeat >> 8) & 0xff);
						stream.writeInt8(event.microsecondsPerBeat & 0xff);

						break;
					case "smpteOffset":
						stream.writeInt8(0x54);
						stream.writeVarInt(5);

						var frameByte = {24: 0x00, 25: 0x20, 29: 0x40, 30: 0x60}[event.frameRate];
						stream.writeInt8(event.hour | frameByte);
						stream.writeInt8(event.min);
						stream.writeInt8(event.sec);
						stream.writeInt8(event.frame);
						stream.writeInt8(event.subframe);

						break;
					case "timeSignature":
						stream.writeInt8(0x58);
						stream.writeVarInt(4);

						stream.writeInt8(event.numerator);
						stream.writeInt8(Math.log(event.denominator) / Math.log(2));
						stream.writeInt8(event.metronome);
						stream.writeInt8(event.thirtyseconds);

						break;
					case "keySignature":
						stream.writeInt8(0x59);
						stream.writeVarInt(2);

						stream.writeInt8(event.key);
						stream.writeInt8(event.scale);

						break;
					case "sequencerSpecific":
						stream.writeInt8(0x7f);
						stream.writeVarInt(event.data.length);

						stream.write(event.data);

						break;
					default:
						throw ("unhandled event subtype:" + event.subtype);
				}

				break;
			case "sysEx":
				stream.writeInt8(0xf0);
				stream.writeVarInt(event.data.length);
				stream.write(event.data);

				break;
			case "dividedSysEx":
				stream.writeInt8(0xf7);
				stream.writeVarInt(event.data.length);
				stream.write(event.data);

				break;
			case "channel":
				switch (event.subtype) {
					case "noteOn":
						stream.writeInt8(0x90 | event.channel);
						stream.writeInt8(event.noteNumber);
						stream.writeInt8(event.velocity);

						break;
					case "noteOff":
						stream.writeInt8(0x80 | event.channel);
						stream.writeInt8(event.noteNumber);
						stream.writeInt8(event.velocity ? event.velocity : 0);

						break;
					case "noteAftertouch":
						stream.writeInt8(0xa0 | event.channel);
						stream.writeInt8(event.noteNumber);
						stream.writeInt8(event.amount);

						break;
					case "controller":
						stream.writeInt8(0xb0 | event.channel);
						stream.writeInt8(event.controllerType);
						stream.writeInt8(event.value);

						break;
					case "programChange":
						stream.writeInt8(0xc0 | event.channel);
						stream.writeInt8(event.programNumber);

						break;
					case "channelAftertouch":
						stream.writeInt8(0xd0 | event.channel);
						stream.writeInt8(event.amount);

						break;
					case "pitchBend":
						stream.writeInt8(0xe0 | event.channel);
						stream.writeInt8(event.value & 0xff);
						stream.writeInt8((event.value >> 7) & 0xff);

						break;
					default:
						throw ("unhandled event subtype:" + event.subtype);
				}

				break;
			default:
				throw ("unhandled event type:" + event.type);
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
