
import Chess from "chess.js";



interface Move {
	from: string;
	to: string;
	promotion?: string;
	san: string;
	color: string;
	piece: string;
	flags: string;
};


interface MoveCode {
	index: number;
	bits: number;
};


const PGN_TAIL_FIX = " 1/2-1/2";
const BODY_SPLITTER = "\n\n";


const sortedMoves = (game: Chess): Move[] => {
	const moves = game.moves({verbose: true});
	moves.forEach(move => move.key = `${move.from}${move.to}${move.promotion || ""}`);
	moves.sort((m1, m2) => m1 > m2 ? 1 : -1);

	return moves;
};


const joinMoveCodes = (codes: MoveCode[]): number[] => {
	//const bitTotal = codes.reduce((sum, code) => sum + code.bits, 0);

	let byte = 0;
	let bits = 0;

	const array = [];
	codes.forEach(code => {
		byte |= code.index << bits;
		bits += code.bits;

		while (bits >= 8) {
			array.push(byte & 0xff);
			bits -= 8;
			byte >>= 8;
		}
	});

	if (byte)
		array.push(byte);

	return array;
};


const parseMoveCodes = (game: Chess, bytes: number[]): void => {
	let byte = 0;
	let bits = 0;

	while (bytes.length || byte) {
		const moves = sortedMoves(game);
		const moveBits = Math.ceil(Math.log2(moves.length));

		while (moveBits > bits) {
			const newByte = bytes.shift();
			byte |= newByte << bits;
			bits += 8;
		}

		const index = byte & ((1 << moveBits) - 1);
		bits -= moveBits;
		byte >>= moveBits;

		console.assert(index < moves.length, game.history(), moves, index, bytes);
		if (index >= moves.length)
			throw new Error("invalid move codes");

		game.move(moves[index]);
	}
};


const compressPGN = (pgn: string): string => {
	const game = new Chess();
	game.load_pgn(pgn);

	const moveLength = game.history().length;

	const codes = [];
	for (let i = 0; i < moveLength; ++i) {
		const move = game.undo();

		const moves = sortedMoves(game);

		const index = moves.findIndex(m => m.san === move.san);
		const bits = Math.ceil(Math.log2(moves.length));

		codes.unshift({index, bits});
	}
	const bytes = joinMoveCodes(codes);
	//console.log("bytes:", bytes, codes);

	const base64 = btoa(bytes.map(byte => String.fromCharCode(byte)).join(""));

	const parts = pgn.split(BODY_SPLITTER);
	if (parts.length > 1)
		return [parts[0], base64].join(BODY_SPLITTER);

	return base64;
};


const decompressToPGN = (code: string): string => {
	const game = new Chess();

	//let setup = false;
	let base64 = code;
	const parts = code.split(BODY_SPLITTER);
	if (parts.length > 1) {
		const startPGN = parts[0] + BODY_SPLITTER + PGN_TAIL_FIX;
		game.load_pgn(startPGN);

		//setup = true;
		base64 = parts[1];
	}

	const moveBytes = atob(base64).split("").map(byte => byte.charCodeAt(0));
	parseMoveCodes(game, moveBytes);

	const pgn = game.pgn();
	//if (setup)
	//	pgn = pgn.replace(PGN_TAIL_FIX, "");

	return pgn;
};



export {
	compressPGN,
	decompressToPGN,
};
