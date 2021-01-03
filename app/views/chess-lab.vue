<template>
	<div class="chess-lab"
		:class="{
			'edit-mode': editMode,
			'play-mode': playMode,
			'drag-hover': drageHover,
		}"
		v-resize="onResize"
		:style="{['--aside-width']: `${asideWidth}px`}"
		@dragover.prevent="drageHover = true"
		@dragleave="drageHover = false"
		@drop.prevent="onDropFiles"
	>
		<StoreInput v-show="false" v-model="notation" sessionKey="chessLab.notation" />
		<main>
			<div id="board" ref="board"></div>
			<svg class="marks" viewBox="0 0 800 800" :width="checkerSize * 8" :height="checkerSize * 8">
				<g transform="translate(0, 800) scale(1, -1)">
					<g :transform="orientationFlipped ? 'rotate(180, 400, -400)' : null">
						<polygon v-for="(move, i) of noticableMoves" :key="i"
							:transform="`translate(${move.arrow.x}, ${move.arrow.y}) rotate(${move.arrow.angle})`"
							:points="[].concat(...move.arrow.points).join(' ')"
							:fill="move.arrow.fill"
						/>
					</g>
				</g>
			</svg>
		</main>
		<aside class="left-sider">
			<section class="analyzer" :class="{active: chosenAnalyzer}">
				<h3>Analyzer</h3>
				<select v-model="chosenAnalyzer">
					<option :value="null">(None)</option>
					<option v-for="name of engineAnalyzerList" :key="name">{{name}}</option>
				</select>
			</section>
			<section class="engine-logs">
				<pre ref="engineLogs"></pre>
			</section>
		</aside>
		<aside class="right-sider">
			<div class="notation">
				<input class="pgn-box" type="text" readonly placeholder="PGN text" title="press Ctrl+C/Ctrl+V here"
					:class="{
						activated: pgnBoxInputActivated || pgnBoxOutputActivated || pgnBoxErrorActivated,
						input: pgnBoxInputActivated,
						output: pgnBoxOutputActivated,
						error: pgnBoxErrorActivated,
					}"
					@copy="onPgnBoxCopy"
					@paste="onPgnBoxPaste"
				/>
				<button @click="downloadPGN" :disabled="!notation">&#x1f4be;</button>
			</div>
			<div class="move-list">
				<table>
					<tbody>
						<tr v-for="move of moveList" :key="move.index">
							<th :class="{current: move.index === currentMoveIndex}">{{move.index}}.</th>
							<td :class="{current: move.index === currentMoveIndex && blackOnTurn}" @click="seekHistory(move.index * 2 - 2)">{{move.w}}</td>
							<td :class="{current: move.index === currentMoveIndex && whiteOnTurn}" @click="seekHistory(move.index * 2 - 1)">{{move.b}}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</aside>
		<footer>
			<button v-if="playMode" @click="undoMove">&#x2b10;</button>
			<button v-if="playMode" @click="redoMove">&#x2b0e;</button>
			<button v-if="editMode" @click="clearBoard">&#x1f5d1;</button>
			<button v-if="editMode" @click="startPosition">&#x1f3e0;</button>
			<CheckButton class="turn" v-model="whiteOnTurn" :disabled="playMode" :title="`${whiteOnTurn ? 'white' : 'black'} is on turn`" />
			<button @click="flipOrientation">&#x1f503;</button>
			<CheckButton class="edit" content="&#x1F58A;" v-model="editMode" />
		</footer>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import Chess from "chess.js";
	import sha1 from "sha1";
	import {debounce} from "lodash";
	import color from "color";

	import {msDelay} from "../delay";
	import {downloadURL} from "../utils";
	import * as chessEngines from "../chessEngines";

	import QuitCleaner from "../mixins/quit-cleaner";

	import CheckButton from "../components/check-button.vue";
	import StoreInput from "../components/store-input.vue";



	const historyContains = (h1, h2) => {
		if (h1.length >= h2.length) {
			for (let i = 0; i < h2.length; i++) {
				const m1 = h1[i];
				const m2 = h2[i];

				if (m1 !== m2)
					return false;
			}

			return true;
		}

		return false;
	};


	const coordinateXY = name => ({
		x: name[0].charCodeAt(0) - "a".charCodeAt(0),
		y: Number(name[1]) - 1,
	});


	const moveToArrow = (from, to, value, weight) => {
		const fromXY = coordinateXY(from);
		const toXY = coordinateXY(to);
		const vector = {x: toXY.x - fromXY.x, y: toXY.y - fromXY.y};
		const angle = -Math.atan2(vector.x, vector.y) * 180 / Math.PI;
		const x = (fromXY.x + 0.5) * 100;
		const y = (fromXY.y + 0.5) * 100;
		const length = Math.sqrt(vector.x ** 2 + vector.y ** 2) * 100;

		const WIDTH = 20;
		const ROOT = 35;
		const TIP_SIZE = 40;

		const points = [
			[-WIDTH / 2, ROOT], [-WIDTH / 2, length - TIP_SIZE], [-TIP_SIZE, length - TIP_SIZE],
			[0, length],
			[+TIP_SIZE, length - TIP_SIZE], [+WIDTH / 2, length - TIP_SIZE], [+WIDTH / 2, ROOT],
		];

		const fill = color.hsv([60 + 60 * Math.tanh(value), 100, 80]).alpha(weight * .9 + .1).toString();

		return {x, y, angle, points, fill};
	};



	export default {
		name: "chess-lab",


		directives: {
			resize,
		},


		mixins: [
			QuitCleaner,
		],


		components: {
			CheckButton,
			StoreInput,
		},


		data () {
			return {
				editMode: true,
				whiteOnTurn: true,
				orientationFlipped: false,
				setupPosition: null,
				history: [],
				asideWidth: 200,
				checkerSize: 100,
				notation: null,
				currentMoveIndex: 0,
				pgnBoxInputActivated: false,
				pgnBoxOutputActivated: false,
				pgnBoxErrorActivated: false,
				drageHover: false,
				engineAnalyzerList: Object.keys(chessEngines.analyzers),
				enginePlayerList: Object.keys(chessEngines.players),
				chosenAnalyzer: null,
				analyzation: null,
			};
		},


		computed: {
			playMode () {
				return !this.editMode;
			},


			blackOnTurn () {
				return !this.whiteOnTurn;
			},


			fenPostfix () {
				const turn = this.whiteOnTurn ? "w" : "b";
				const castlings = "KQkq";
				const enpassant = "-";
				const clock = 0;
				const fullmoves = 1;

				return ` ${turn} ${castlings} ${enpassant} ${clock} ${fullmoves}`;
			},


			moveList () {
				const length = Math.ceil(this.history.length / 2);

				return Array(length).fill().map((_, i) => ({
					w: this.history[i * 2],
					b: this.history[i * 2 + 1],
					index: i + 1,
				}));
			},


			currentHistoryIndex () {
				return (this.currentMoveIndex - 1) * 2 + (this.whiteOnTurn ? 1 : 0);
			},


			noticableMoves () {
				if (!this.analyzation)
					return [];

				// softmax values
				const items = this.analyzation.map(item => ({...item}));
				items.forEach(item => item.valueExp = Math.exp(item.value * 1));

				const expsum = items.reduce((sum, item) => sum + item.valueExp, 0);
				//console.log("expsum:", expsum);
				items.forEach(item => item.weight = item.valueExp / expsum);

				const noticableItems = items.filter((item, i) => item.weight > 1 / items.length || i < 3);

				this.game.moves({verbose: true}).forEach(move => {
					const item = noticableItems.find(item => item.move === move.san);
					if (item) {
						item.from = move.from;
						item.to = move.to;

						item.arrow = moveToArrow(move.from, move.to, item.value, item.weight);
					}
				});

				return noticableItems;
			},
		},


		created () {
			this.boardConfig = {
				draggable: true,
				dropOffBoard: "trash",
				sparePieces: true,
				pieceTheme: "/chess/pieces/alpha/{piece}.png",
				position: "start",
				onDragStart: this.onDragStart.bind(this),
				onDrop: this.onDrop.bind(this),
				onSnapEnd: this.onSnapEnd.bind(this),
			};

			this.game = new Chess();

			/*this.stockfish = new Worker("/chess/engines/stockfish.js");
			this.stockfish.onmessage = event => {
				console.log("stockfish:", event.data);
			};*/

			const keyDownHandler = () => {
				switch (event.code) {
				case "ArrowLeft":
					this.undoMove();

					break;
				case "ArrowRight":
					this.redoMove();

					break;
				//default:
				//	console.debug("key code:", event.code);
				}
			};
			document.addEventListener("keydown", keyDownHandler);
			this.appendCleaner(() => document.removeEventListener("keydown", keyDownHandler));

			this.triggerAnalyzer = debounce(this.doTriggerAnalyzer.bind(this), 200);

			this.appendCleaner(() => this.analyzer && this.analyzer.terminate());
		},


		async mounted () {
			if (!window.jQuery)
				window.jQuery = (await import("jquery")).default;
			if (!window.Chessboard)
				await import ("@chrisoakman/chessboardjs/dist/chessboard-1.0.0.js");
			const Chessboard = window.Chessboard;

			//console.log("Chessboard:", Chessboard);
			this.board = new Chessboard("board", this.boardConfig);

			if (this.notation) {
				const pgn = this.notation;
				this.editMode = false;

				await this.$nextTick();
				if (this.game.load_pgn(pgn)) {
					this.syncBoard();
					this.updateStatus();
				}
			}
		},


		methods: {
			onResize () {
				if (this.board) {
					this.board.resize();

					this.asideWidth = (window.innerWidth - this.$refs.board.clientWidth) / 2;

					this.$nextTick(() => this.checkerSize = this.$refs.board.querySelector(".board-b72b1").clientWidth / 8);
				}
			},


			onDragStart (source, piece/*, position, orientation*/) {
				//console.log("onDragStart:", source, piece, position, orientation);

				if (this.editMode)
					return true;

				if (this.game.game_over())
					return false;

				//console.log("onDragStart:", this.game.turn(), piece, ((this.game.turn() === "w") ^ /^b/.test(piece)));
				return !!((this.game.turn() === "w") ^ /^b/.test(piece));
			},


			onDrop (source, target) {
				if (this.playMode) {
					const move = this.game.move({
						from: source,
						to: target,
						promotion: "q", // NOTE: always promote to a queen for example simplicity
					});
					//console.log("move:", move);

					// illegal move
					if (!move)
						return "snapback";

					this.updateStatus();
				}
				else
					this.editDirty = true;
			},


			onSnapEnd () {
				//console.log("fen:", this.game.fen());
				if (this.playMode)
					this.syncBoard();

				if (this.editMode)
					this.editDirty = true;
			},


			flipOrientation () {
				if (this.board) {
					this.board.flip();
					this.orientationFlipped = this.board.orientation() === "black";
				}
			},


			startPosition () {
				if (this.board)
					this.board.start();

				this.whiteOnTurn = true;
				this.editDirty = true;
			},


			clearBoard () {
				if (this.board)
					this.board.clear();

				this.editDirty = true;
			},


			syncBoard () {
				this.board.position(this.game.fen());
			},


			updateStatus () {
				this.whiteOnTurn = this.game.turn() === "w";

				const history = this.game.history();
				if ((history.length % 2) ^ (!this.whiteOnTurn))
					history.unshift("...");

				if (!historyContains(this.history, history)) {
					this.history = history;
					this.notation = this.game.pgn();
				}

				this.currentMoveIndex = Math.ceil(history.length / 2);

				this.analyzation = null;
				if (this.analyzer)
					this.triggerAnalyzer();
			},


			undoMove () {
				if (this.currentHistoryIndex > 0) {
					this.game.undo();
					this.syncBoard();
					this.updateStatus();
				}
			},


			redoMove () {
				//console.log("redo:", this.currentHistoryIndex, this.history.length);
				if (this.history.length > this.currentHistoryIndex + 1) {
					const nextMove = this.history[this.currentHistoryIndex + 1];
					this.game.move(nextMove);
					this.syncBoard();
					this.updateStatus();
				}
			},


			seekHistory (index) {
				while (this.currentHistoryIndex > index) {
					this.game.undo();
					this.updateStatus();
				}

				while (this.currentHistoryIndex < index) {
					const nextMove = this.history[this.currentHistoryIndex + 1];
					this.game.move(nextMove);
					this.updateStatus();
				}

				this.syncBoard();
			},


			onPgnBoxCopy () {
				//console.log("copy:", event);
				navigator.clipboard.writeText(this.notation);
				this.pgnBoxOutputActivated = true;
			},


			async onPgnBoxPaste (event) {
				//console.log("paste:", event);
				const text = await new Promise(resolve => [...event.clipboardData.items][0].getAsString(resolve));
				if (text)
					this.loadNotation(text);
			},


			async onDropFiles () {
				this.drageHover = false;

				const file = event.dataTransfer.files[0];
				switch (file.type) {
				case "text/plain":
				case "":
					const text = await file.readAs("Text");
					this.loadNotation(text);

					break;
				}
			},


			loadNotation (notation) {
				if (this.game.load_pgn(notation)) {
					this.syncBoard();
					this.updateStatus();

					this.pgnBoxInputActivated = true;
				}
				else {
					console.debug("invalid PGN text:", notation);
					this.pgnBoxErrorActivated = true;
				}
			},


			downloadPGN () {
				const blob = new Blob([this.notation]);
				const url = URL.createObjectURL(blob);
				const filename = sha1(this.notation) + ".pgn";

				downloadURL(url, filename);
			},


			doTriggerAnalyzer () {
				if (this.analyzer)
					this.analyzer.analyze(this.game.fen());
			},
		},


		watch: {
			editMode (value) {
				this.boardConfig.sparePieces = value;
				this.boardConfig.dropOffBoard = value ? "trash" : "snapback";

				if (value)
					this.editDirty = false;

				if (!value && this.editDirty) {
					const fen = this.board.fen() + this.fenPostfix;
					const loaded = this.game.load(fen);
					//console.log("fen:", loaded, this.board.fen(), this.game.fen());
					if (!loaded) {
						console.warn("invalid editor position:", fen);
						this.editMode = true;
					}
					else {
						this.setupPosition = fen;
						this.history = [];
						this.updateStatus();
					}
				}
			},


			async pgnBoxInputActivated (value) {
				if (value) {
					await msDelay(100);
					this.pgnBoxInputActivated = false;
				}
			},


			async pgnBoxOutputActivated (value) {
				if (value) {
					await msDelay(100);
					this.pgnBoxOutputActivated = false;
				}
			},


			async pgnBoxErrorActivated (value) {
				if (value) {
					await msDelay(100);
					this.pgnBoxErrorActivated = false;
				}
			},


			currentMoveIndex () {
				this.$nextTick(() => {
					const currentNumber = this.$el.querySelector(".move-list th.current");
					if (currentNumber) {
						//console.log("currentNumber:", currentNumber);
						currentNumber.scrollIntoView({block: "nearest", behavior: "smooth"});
					}
				});
			},


			chosenAnalyzer (value) {
				if (this.analyzer) {
					this.analyzer.terminate();
					this.analyzer = null;
				}

				if (value) {
					this.analyzer = chessEngines.analyzers[value]();
					this.analyzer.on("log", data => {
						if (this.$refs.engineLogs) {
							this.$refs.engineLogs.innerText += data + "\n";

							const section = this.$refs.engineLogs.parentElement;
							section.scrollTo(0, section.scrollHeight);
						}
					});
					this.analyzer.on("analyzation", analyzation => this.analyzation = analyzation);

					this.triggerAnalyzer();
				}
			},


			/*analyzation (value) {
				console.log("analyzation:", value);
			},*/
		},
	};
</script>

<style>
	@import "../third-party/chessboard-1.0.0.css";

	.chess-lab main
	{
		max-width: min(100vw, 80vh);
		max-height: 100vh;
	}
</style>

<style lang="scss">
	.play-mode
	{
		.spare-pieces-7492f
		{
			visibility: hidden;
		}

		.board-b72b1
		{
			box-shadow: 0 0 24px #000;
		}
	}

	.edit-mode
	{
		.board-b72b1
		{
			outline: 4px solid #7fa650;
		}
	}
</style>

<style lang="scss" scoped>
	$panel-background-color: #21201d;

	$button-color: #383633;
	$button-active-color: #7fa650;
	$button-hover-color: #585653;
	$button-active-hover-color: #9fc670;

	$error-color: #ca3028;


	.chess-lab
	{
		font-family: Segoe UI, "Helvetica Neue", Helvetica, Arial, sans-serif;
		background-color: #312e2b;
		color: #b7b7b7;

		main
		{
			position: relative;
			margin: 0 auto;

			#board
			{
				height: 100%;
				width: 100%;
				background-color: #fff1;
			}

			.marks
			{
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				pointer-events: none;
			}
		}

		footer
		{
			position: absolute;
			right: 0;
			bottom: 0;
			background-color: $panel-background-color;
			border-top-left-radius: 12px;
			padding: 12px;

			& > button
			{
				margin: 0 .2em;
				font-size: 30px;
				vertical-align: middle;
			}
		}

		aside
		{
			position: absolute;
			width: var(--aside-width);
			top: 0;
			height: 100%;
			box-sizing: border-box;
		}

		select
		{
			background-color: $button-color;
			color: inherit;
			border-radius: 2px;
		}

		.left-sider
		{
			left: 0;
			display: flex;
			flex-direction: column;

			h3
			{
				display: inline-block;
				margin: 0 1em;
			}

			section
			{
				padding: 1em;
			}

			.analyzer
			{
				flex: 0 0 auto;

				&.active select
				{
					background-color: $button-active-color;
					color: #fff;
				}
			}

			.engine-logs
			{
				flex: 0 1 auto;
				overflow: auto;
				background: #000c;
				color: #ccc;

				pre
				{
					margin: 0;
					//white-space: pre-wrap;
					font-size: 9px;
				}
			}
		}

		.right-sider
		{
			right: 0;
			display: flex;
			flex-direction: column;
			padding-bottom: 80px;
		}

		&.drag-hover .right-sider
		{
			background-color: #cfc4;

			.pgn-box
			{
				background-color: #cfc;
			}
		}

		.notation
		{
			flex: 0 0 auto;
			padding: 1em;
			display: flex;

			.pgn-box
			{
				background-color: $button-color;
				color: inherit;
				transition: background-color .6s ease-out;
				flex: 1 1 auto;

				&.activated
				{
					transition: background-color .01s;

					&.output
					{
						background-color: $button-active-color;
					}

					&.input
					{
						background-color: #f5f568;
					}

					&.error
					{
						background-color: $error-color;
					}
				}
			}

			button
			{
				flex: 0 0 auto;
				margin: 0 .2em;
			}
		}

		.move-list
		{
			font-size: 13px;
			flex: 1 1 auto;
			overflow-y: auto;

			th
			{
				font-weight: normal;
				width: 1em;
				padding: 0 1em;
				text-align: right;
				user-select: none;

				&.current
				{
					color: white;
				}
			}

			td
			{
				font-weight: bold;
				width: 5em;
				cursor: pointer;

				&.current
				{
					color: white;
					text-shadow: 0 0 3px #000;
					outline: 2px solid #fff2;
				}

				&:hover
				{
					background-color: #aaa2;
				}
			}
		}

		.turn
		{
			width: 48px;
			height: 48px;

			&.on
			{
				background-image: url(../assets/chess/wP.svg);
			}

			&.off
			{
				background-image: url(../assets/chess/bP.svg);
			}
		}

		button
		{
			background-color: $button-color;
			color: inherit;
			border: 0;
			border-radius: 8px;

			&:not([disabled])
			{
				cursor: pointer;
			}

			&:hover:not([disabled])
			{
				background-color: $button-hover-color;
			}

			&.on
			{
				background-color: $button-active-color;
				color: white;

				&:hover:not([disabled])
				{
					background-color: $button-active-hover-color;
				}
			}

			&.turn
			{
				background-color: $button-color;
				color: inherit;

				&:hover:not([disabled])
				{
					background-color: $button-hover-color;
				}
			}
		}
	}
</style>
