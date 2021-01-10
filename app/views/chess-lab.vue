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
		<BoolStoreInput v-show="false" v-model="orientationFlipped" sessionKey="chessLab.orientationFlipped" />
		<BoolStoreInput v-show="false" v-model="showArrowMarks" localKey="chessLab.showArrowMarks" />
		<StoreInput v-show="false" v-model="chosenAnalyzer" localKey="chessLab.chosenAnalyzer" />
		<main>
			<div id="board" ref="board"></div>
			<svg v-show="!editMode" class="marks" viewBox="0 0 800 800" :width="checkerSize * 8" :height="checkerSize * 8">
				<g transform="translate(0, 800) scale(1, -1)">
					<g :transform="orientationFlipped ? 'rotate(180, 400, 400)' : null">
						<g v-if="showArrowMarks">
							<polygon v-for="(move, i) of noticableMoves" :key="i" class="move"
								:class="{best: i === 0}"
								:transform="`translate(${move.arrow.x}, ${move.arrow.y}) rotate(${move.arrow.angle})`"
								:points="[].concat(...move.arrow.points).join(' ')"
								:fill="move.arrow.fill"
							/>
						</g>
					</g>
				</g>
				<text class="result" :class="{flipped: orientationFlipped, mate: gameResult !== 'draw'}" v-if="gameResult" :x="400" :y="500">
					<tspan v-if="gameResult === 'draw'">&#x00bd;</tspan>
					<tspan v-if="gameResult === 'white'">0:1</tspan>
					<tspan v-if="gameResult === 'black'">1:0</tspan>
				</text>
			</svg>
		</main>
		<aside class="left-sider">
			<section class="analyzer" :class="{active: chosenAnalyzer}">
				<h3>Analyzer</h3>
				<select v-model="chosenAnalyzer">
					<option :value="null">(None)</option>
					<option v-for="name of engineAnalyzerList" :key="name">{{name}}</option>
				</select>
				<CheckButton v-if="chosenAnalyzer" v-model="showArrowMarks" title="show arrows on board" content="&#x21e7;" />
			</section>
			<section class="engine-logs">
				<pre ref="engineLogs"></pre>
			</section>
			<section class="winrate" v-if="winRates">
				<Chart ref="winrateChart" type="Line" :sourceData="winrateChart" />
				<span class="white crown"></span>
				<span class="black crown"></span>
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
				<span class="help">
					<span class="icon" @click="showNotationTips = true" :class="{on: showNotationTips}">&#9432;</span>
					<div class="tips embed-dialog" v-show="showNotationTips"
						@mouseleave="showNotationTips = false"
					>
						<p>Drag this widget link into your bookmark bar<wbr/> to copy notation in third-party websites.</p>
						<ul>
							<li v-for="widget of PGN_WIDGETS" :key="widget.domain">
								<a :href="widget.script">{{widget.domain}}.copyNotation</a>
							</li>
						</ul>
					</div>
				</span>
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
	import Vue from "vue";

	import {msDelay} from "../delay";
	import {downloadURL} from "../utils";
	import * as chessEngines from "../chessEngines";

	import QuitCleaner from "../mixins/quit-cleaner";

	import CheckButton from "../components/check-button.vue";
	import StoreInput from "../components/store-input.vue";
	import BoolStoreInput from "../components/bool-store-input.vue";
	import Chart from "../components/chart.vue";



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
			[-WIDTH / 2, ROOT], [-WIDTH / 2, length - TIP_SIZE], [-TIP_SIZE * 0.7, length - TIP_SIZE],
			[0, length],
			[+TIP_SIZE * 0.7, length - TIP_SIZE], [+WIDTH / 2, length - TIP_SIZE], [+WIDTH / 2, ROOT],
		];

		const fill = color.hsv([60 + 60 * Math.tanh(value / 8), 100, 80]).alpha(weight * .9 + .1).toString();

		return {x, y, angle, points, fill};
	};


	const PGN_WIDGETS = [
		{
			domain: "Chesscom",
			script: "javascript:navigator.clipboard.writeText([...document.querySelectorAll(\"vertical-move-list .move\")].map((move, i) => `${i+1}. ${move.querySelector(\".white\").textContent} ${move.querySelector(\".black\") ? move.querySelector(\".black\").textContent : ''}`).join(\" \"));alert('Chess notation text copied.');",
		},
	];



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
			BoolStoreInput,
			Chart,
		},


		data () {
			return {
				editMode: false,
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
				winRates: null,
				gameResult: null,
				PGN_WIDGETS,
				showNotationTips: false,
				showArrowMarks: true,
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
				const items = this.analyzation.branches.map(item => ({...item}));
				items.forEach(item => item.valueExp = Math.exp(item.value * 3));

				const expsum = items.reduce((sum, item) => sum + item.valueExp, 0);
				//console.log("expsum:", expsum);
				items.forEach(item => item.weight = item.valueExp / expsum);

				const noticableItems = items.filter((item, i) => item.weight > 1 / items.length || i < 3);

				/*this.game.moves({verbose: true}).forEach(move => {
					const item = noticableItems.find(item => item.move === move.san);
					if (item) {
						item.from = move.from;
						item.to = move.to;

						item.arrow = moveToArrow(move.from, move.to, item.value, item.weight);
					}
				});*/
				items.forEach(item => item.arrow = moveToArrow(item.move[0], item.move[1], item.value, item.weight));

				return noticableItems;
			},


			winrateChart () {
				const rows = this.winRates
					.map((item, step) => ({step, item}))
					.filter(({item}) => item)
					.map(({step, item}) => ({step: Number(step), rate: item.rate}));

				return {
					height: "240px",
					settings: {
						dimension: ["step"],
						metrics: ["rate"],
						xAxisType: "value",
						animation: false,
					},
					theme: {
						line: {
							smooth: false,
						},
						grid: {
							left: 8,
							top: 8,
							right: 8,
							bottom: 8,
						},
					},
					legend: {
						show: false,
					},
					yAxis: {
						max: 1,
						min: -1,
						splitLine: {
							show: false,
						},
						splitArea: {
							show: true,
							interval: 2,
						},
					},
					data: {
						columns: ["step", "rate"],
						rows,
					},
					markLine: {
						animation: false,
						data: [
							{
								xAxis: this.currentHistoryIndex + 1,
							},
						],
					},
					animation: {animation: false},
				};
			},
		},


		created () {
			this.boardConfig = {
				draggable: true,
				dropOffBoard: "trash",
				sparePieces: true,
				pieceTheme: "chess/pieces/alpha/{piece}.png",
				position: "start",
				onDragStart: this.onDragStart.bind(this),
				onDrop: this.onDrop.bind(this),
				onSnapEnd: this.onSnapEnd.bind(this),
			};

			this.game = new Chess();

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

			this.triggerAnalyzer = debounce(this.doTriggerAnalyzer.bind(this), 600);

			this.appendCleaner(() => this.analyzer && this.analyzer.terminate());
		},


		async mounted () {
			if (!window.jQuery)
				window.jQuery = (await import("jquery")).default;
			if (!window.Chessboard)
				await import ("@chrisoakman/chessboardjs/dist/chessboard-1.0.0.js");
			const Chessboard = window.Chessboard;

			//console.log("Chessboard:", Chessboard);
			this.boardConfig.orientation = this.orientationFlipped ? "black" : "white";

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

			this.onResize();
		},


		methods: {
			onResize () {
				if (this.board) {
					this.board.resize();

					this.asideWidth = (this.$el.clientWidth - this.$refs.board.clientWidth) / 2;

					this.$nextTick(() => this.checkerSize = this.$refs.board.querySelector(".board-b72b1").clientWidth / 8);
				}

				this.$refs.winrateChart && this.$refs.winrateChart.getVChart().resize();
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
				this.orientationFlipped = !this.orientationFlipped;
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

				this.gameResult = null;
				if (this.game.game_over())
					this.gameResult = this.game.in_draw() ? "draw" : (this.whiteOnTurn ? "black" : "white");
			},


			undoMove () {
				if (this.currentHistoryIndex >= 0) {
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

					if (this.analyzer)
						this.analyzer.newGame();

					this.pgnBoxInputActivated = true;

					this.winRates = this.analyzer ? [] : null;
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
				if (this.analyzer) {
					if (this.game.game_over())
						this.analyzer.analyzeStop();
					else
						this.analyzer.analyze(this.game.fen());
				}
			},


			setHistory (moves) {
				this.editMode = false;
				if (historyContains(moves, this.history)) {
					const newMoves = moves.slice(this.history.length);
					newMoves.forEach(move => this.game.move(move));
				}
				else if (historyContains(this.history, moves)) {
					for (let i = 0; i < this.history.length - moves.length; i++)
						this.game.undo();
				}
				else {
					const ms = [...moves];
					if (ms.length % 2)
						ms.push("");

					const pgn = Array(ms.length / 2).fill(null).map((_, i) => `${i + 1}. ${ms[i * 2]} ${ms[i * 2 + 1]}`).join(" ");
					this.game.load_pgn(pgn);

					if (this.analyzer)
						this.analyzer.newGame();

					this.winRates = this.analyzer ? [] : null;;
				}

				this.syncBoard();
				this.updateStatus();
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
						this.winRates = this.analyzer ? [] : null;;
						this.updateStatus();

						if (this.analyzer)
							this.analyzer.newGame();
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
							if (this.$refs.engineLogs.innerText.length > 0x4000) {
								const lines = this.$refs.engineLogs.innerText = this.$refs.engineLogs.innerText.split("\n");
								this.$refs.engineLogs.innerText = lines.slice(Math.max(lines.length - 90, 0)).join("\n");
							}

							const section = this.$refs.engineLogs.parentElement;
							section.scrollTo(0, section.scrollHeight);
						}
					});
					this.analyzer.on("analyzation", analyzation => {
						if (analyzation.fen === this.game.fen()) {
							this.analyzation = analyzation;

							const best = analyzation.best;
							const oldRate = this.winRates[this.currentHistoryIndex + 1];
							if (!oldRate || best.depth >= oldRate.depth) {
								const reversion = this.game.turn() === "w" ? 1 : -1;

								let rate = 0;
								if (Number.isFinite(best.scoreMate))
									rate = reversion * Math.sign(best.scoreMate);
								else
									rate = reversion * Math.tanh(best.scoreCP / 400);

								Vue.set(this.winRates, this.currentHistoryIndex + 1, {
									depth: best.depth,
									rate,
								});
							}
						}
					});

					this.winRates = [];

					this.triggerAnalyzer();
				}
			},


			orientationFlipped (value) {
				if (this.board)
					this.board.orientation(value ? "black" : "white");
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

	.chess-lab footer
	{
		font-size: min(30px, 4vh);
	}
</style>

<style lang="scss">
	.notation-322f9
	{
		font-size: 4vh;
	}

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

				.move.best
				{
					stroke: #000a;
					stroke-width: 5px;
				}

				.result
				{
					font-size: 280px;
					font-weight: bold;
					text-anchor: middle;
					transform-origin: 50% 50%;

					.trophy
					{
						font-size: 120px;
					}

					&.mate
					{
						transform: rotate(90deg);
					}

					&.mate.flipped
					{
						transform: rotate(-90deg);
					}
				}
			}
		}

		footer
		{
			position: absolute;
			right: 0;
			bottom: 0;
			background-color: $panel-background-color;
			border-top-left-radius: .4em;
			padding: .4em;
			//font-size: 30px;

			& > button
			{
				margin: 0 .2em;
				vertical-align: middle;
				font-size: inherit;
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
			padding-top: 1em;

			h3
			{
				display: inline-block;
				margin: 0;
			}

			.analyzer
			{
				flex: 0 0 auto;
				padding: 1em;

				&.active select
				{
					background-color: $button-active-color;
					color: #fff;
				}

				& > * + *
				{
					margin-left: 1em;
				}
			}

			.engine-logs
			{
				flex: 1 1 auto;
				overflow: auto;
				background: #000c;
				color: #ccc;
				padding: .2em;

				&::-webkit-scrollbar
				{
					display: none;
				}

				pre
				{
					margin: 0;
					white-space: pre-wrap;
					font-size: 9px;
				}
			}

			.winrate
			{
				flex: 0 0 auto;
				padding: 0;
				position: relative;

				.crown
				{
					position: absolute;
					left: 0;
					width: 16px;
					height: 16px;

					&.white
					{
						background-image: url(../assets/chess/crown-white.svg);
						top: 0;
					}

					&.black
					{
						background-image: url(../assets/chess/crown-black.svg);
						bottom: 0;
					}
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

		.embed-dialog
		{
			position: absolute;
			background-color: #111;
			padding: 1em;
			z-index: 100;
			border-radius: 4px;
			box-shadow: 0px 8px 20px #000;
		}

		.notation
		{
			flex: 0 0 auto;
			padding: 1em;
			display: flex;
			flex-direction: row;

			.pgn-box
			{
				background-color: $button-color;
				color: inherit;
				transition: background-color .6s ease-out;
				flex: 1 1 2em;
				width: 2em;

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

			.help
			{
				flex: 0 0 auto;
				position: relative;

				.icon
				{
					cursor: pointer;

					&.on
					{
						color: #cfc;
					}
				}

				.tips
				{
					top: 100%;
					right: 0;
					white-space: nowrap;

					p
					{
						margin: .4em;
					}

					ul
					{
						list-style: none;
						margin: .4em;
						padding: 0;
						font-size: 12px;

						a
						{
							display: inline-block;
							padding: .2em .6em;
							text-decoration: none;
							background-color: $button-active-color;
							color: #fff;
							border-radius: .8em;
							font-weight: bold;
						}
					}
				}
			}
		}

		.move-list
		{
			font-size: 13px;
			flex: 1 1 auto;
			overflow-y: auto;

			&::-webkit-scrollbar
			{
				display: none;
			}

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
			//width: 1.4em;
			//height: 1.4em;
			line-height: 140%;
			background-size: contain;

			&::before
			{
				content: "\3000";
			}

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
