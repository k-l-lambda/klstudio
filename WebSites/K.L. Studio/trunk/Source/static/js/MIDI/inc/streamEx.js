/* Wrapper for accessing strings through sequential writes */
function OStream() {
	var buffer = "";

	function write(str) {
		buffer += str;
	}

	/* write a big-endian 32-bit integer */
	function writeInt32(i) {
		buffer += String.fromCharCode((i >> 24) & 0xff)+ String.fromCharCode((i >> 16) & 0xff)
			+ String.fromCharCode((i >> 8) & 0xff) + String.fromCharCode(i & 0xff);
	}

	/* write a big-endian 16-bit integer */
	function writeInt16(i) {
		buffer += String.fromCharCode((i >> 8) & 0xff) + String.fromCharCode(i & 0xff);
	}

	/* write an 8-bit integer */
	function writeInt8(i) {
		buffer += String.fromCharCode(i & 0xff);
	}

	/* write a MIDI-style variable-length integer
		(big-endian value in groups of 7 bits,
		with top bit set to signify that another byte follows)
	*/
	function writeVarInt(i) {
		var str = "";

		var b = i & 0x7f;
		i >>= 7;
		str = String.fromCharCode(b) + str;

		while (i) {
			var b = i & 0x7f;
			i >>= 7;
			str = String.fromCharCode(b | 0x80) + str;
		}

		buffer += str;
	}

	function getBuffer() {
		return buffer;
	}

	return {
		'getBuffer': getBuffer,
		'write': write,
		'writeInt32': writeInt32,
		'writeInt16': writeInt16,
		'writeInt8': writeInt8,
		'writeVarInt': writeVarInt
	}
}