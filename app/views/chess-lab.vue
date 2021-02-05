<template>
	<div class="chess-lab"
		:class="{
			'edit-mode': editMode,
			'play-mode': playMode,
			'drag-hover': drageHover,
			'full-mode': fullMode,
		}"
		v-resize="onResize"
		:style="{
			'--aside-width': `${asideWidth}px`,
			'--checker-size': `${checkerSize}px`,
			'--board-size': `${checkerSize * 8 + 4}px`,
		}"
		@dragover.prevent="drageHover = true"
		@dragleave="drageHover = false"
		@drop.prevent="onDropFiles"
	>
		<StoreInput v-show="false" v-model="notation" sessionKey="chessLab.notation" />
		<BoolStoreInput v-show="false" v-model="orientationFlipped" sessionKey="chessLab.orientationFlipped" />
		<BoolStoreInput v-show="false" v-model="showArrowMarks" localKey="chessLab.showArrowMarks" />
		<StoreInput v-show="false" v-model="chosenAnalyzer" localKey="chessLab.chosenAnalyzer" />
		<StoreInput v-show="false" v-model="chosenWhitePlayer" sessionKey="chessLab.chosenWhitePlayer" />
		<StoreInput v-show="false" v-model="chosenBlackPlayer" sessionKey="chessLab.chosenBlackPlayer" />
		<StoreInput v-show="false" v-model="whitePlayerMoveTime" sessionKey="chessLab.whitePlayerMoveTime" />
		<StoreInput v-show="false" v-model="blackPlayerMoveTime" sessionKey="chessLab.blackPlayerMoveTime" />
		<main>
			<div id="board" ref="board"
				@click="chosenSquare = null"
				@touchmove.prevent="() => null"
				@contextmenu.prevent="() => null"
			></div>
			<svg v-show="!editMode" class="marks" viewBox="0 0 800 800" :width="checkerSize * 8" :height="checkerSize * 8">
				<g transform="translate(0, 800) scale(1, -1)">
					<g :transform="orientationFlipped ? 'rotate(180, 400, 400)' : null">
						<g v-if="showArrowMarks" class="arrows">
							<polygon v-for="move of noticableMoves" :key="move.hash" class="move"
								:class="{best: move.best, hover: (hoverMove && hoverMove.hash) === move.hash, marked: move.marked}"
								:transform="`translate(${move.arrow.x}, ${move.arrow.y}) rotate(${move.arrow.angle})`"
								:points="[].concat(...move.arrow.points).join(' ')"
								:fill="move.arrow.fill"
								@mouseenter="onHoverMovePointChange(move, $event)"
								@mousemove="onHoverMovePointChange(move, $event)"
								@mouseleave="hoverMove = move === hoverMove ? null : hoverMove"
							/>
						</g>
						<!--g class="last-move" v-if="lastMove">
							<rect width="100" height="100" :x="lastMove.from.x * 100" :y="lastMove.from.y * 100" />
							<rect width="100" height="100" :x="lastMove.to.x * 100" :y="lastMove.to.y * 100" />
						</g-->
						<g class="target-squares">
							<g v-for="square of targetSquares" :key="square.name"
								:transform="`translate(${(square.pos.x + 0.5) * 100}, ${(square.pos.y + 0.5) * 100})`"
								@click.stop="targetMove(square.name)"
								@contextmenu.prevent="targetMark(square.name)"
							>
								<rect :x="-50" :y="-50" :width="100" :height="100" />
								<circle :r="16" />
							</g>
						</g>
					</g>
				</g>
				<text class="result" :class="{flipped: orientationFlipped, mate: gameResult !== 'draw'}" v-if="gameResult" :x="400" :y="500">
					<tspan v-if="gameResult === 'draw'">&#x00bd;</tspan>
					<tspan v-if="gameResult === 'white'">0:1</tspan>
					<tspan v-if="gameResult === 'black'">1:0</tspan>
				</text>
			</svg>
			<div class="promotion" v-if="promotionData"
				:style="{
					left: `${promotionData.left}px`,
					top: `${promotionData.top}px`,
				}"
				@mouseleave="promotionPending = null"
			>
				<span v-for="piece of promotionData.pieces" :key="piece.notation" class="piece"
					@click="promote(piece.notation)"
				>
					<img :src="piece.img">
				</span>
			</div>
			<div id="prediction-board" ref="predictionBoard" v-show="showPredictionBoard"
				@mousemove="onPredictionBlur"
				@contextmenu.prevent="() => null"
			></div>
		</main>
		<aside class="left-sider">
			<section class="engine analyzer" :class="{active: chosenAnalyzer}">
				<span class="logo-placeholder" /><h3>Analyzer</h3>
				<select v-model="chosenAnalyzer">
					<option :value="null">(None)</option>
					<option v-for="name of engineAnalyzerList" :key="name">{{name}}</option>
				</select>
				<CheckButton v-if="chosenAnalyzer" v-model="showArrowMarks" title="show arrows on board" content="&#x21e7;" />
			</section>
			<section class="engine players">
				<h3>Players</h3>
				<button :class="{on: playerIsRunning}" @click="togglePlayer" :title="playButtonTips">
					<i>{{playerIsRunning ? "&#xf04c;" : "&#xf04b;"}}</i>
				</button>
				<button @click="newGame" title="start a new game">
					+ new
				</button>
				<p class="white" :class="{on: whiteOnTurn}">
					<span class="icon"></span>
					<select v-model="chosenWhitePlayer">
						<option :value="null">User</option>
						<option v-for="name of enginePlayerList" :key="name">{{name}}</option>
					</select>
					<span v-if="chosenWhitePlayer">
						<i>&#xf017;</i><select v-model="whitePlayerMoveTime">
							<option :value="null">NULL</option>
							<option :value="1000">1s</option>
							<option :value="3000">3s</option>
							<option :value="5000">5s</option>
							<option :value="10000">10s</option>
							<option :value="30000">30s</option>
						</select>
					</span>
				</p>
				<p class="black" :class="{on: blackOnTurn}">
					<span class="icon"></span>
					<select v-model="chosenBlackPlayer">
						<option :value="null">User</option>
						<option v-for="name of enginePlayerList" :key="name">{{name}}</option>
					</select>
					<span v-if="chosenBlackPlayer">
						<i>&#xf017;</i><select v-if="chosenBlackPlayer" v-model="blackPlayerMoveTime">
							<option :value="null">NULL</option>
							<option :value="1000">1s</option>
							<option :value="3000">3s</option>
							<option :value="5000">5s</option>
							<option :value="10000">10s</option>
							<option :value="30000">30s</option>
						</select>
					</span>
				</p>
			</section>
			<section class="engine-logs">
				<pre ref="engineLogs"></pre>
			</section>
			<section class="winrate" ref="winrate" v-if="winRates">
				<Chart ref="winrateChart" type="Line" :sourceData="winrateChartData" />
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
				<button @click="downloadPGN" :disabled="!notation" title="save PGN file"><i>&#xf0c7;</i></button>
				<section class="share">
					<span class="icon" @click="showSharePanel = !showSharePanel; showNotationTips = false" :class="{on: showSharePanel}"><i>&#xf1e0;</i></span>
					<div class="panel embed-dialog" v-if="showSharePanel"
						@mouseleave="showSharePanel = false"
					>
						<p class="comment">Share the URL of this game to others:</p>
						<p>
							<a class="link" :class="{activated: gameLinkCopied}" :href="gameLink" title="link to this game" target="_blank">{{gameLink}}</a>
							<button title="copy the link" @click="copyGameLink"><i>&#xf0c5;</i></button>
						</p>
						<QRCode :text="gameLink" />
					</div>
				</section>
				<section class="help">
					<span class="icon" @click="showNotationTips = !showNotationTips" :class="{on: showNotationTips}"><i>&#xf059;</i></span>
					<div class="tips embed-dialog" v-show="showNotationTips"
						@mouseleave="showNotationTips = false"
					>
						<p class="comment">Drag this widget link into your bookmark bar<wbr/> to copy notation in third-party websites.</p>
						<ul>
							<li v-for="widget of PGN_WIDGETS" :key="widget.domain">
								<a :href="widget.script">{{widget.domain}}.copyNotation</a>
							</li>
						</ul>
					</div>
				</section>
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
			<button v-if="playMode" @click="undoMove"><i>&#xf0e2;</i></button>
			<button v-if="playMode" @click="redoMove"><i>&#xf01e;</i></button>
			<button v-if="editMode" @click="clearBoard"><i>&#xf2ed;</i></button>
			<button v-if="editMode" @click="startPosition"><i>&#xf015;</i></button>
			<CheckButton class="turn" v-model="whiteOnTurn" :disabled="playMode" :title="`${whiteOnTurn ? 'white' : 'black'} is on turn`" />
			<button @click="flipOrientation" title="flip board"><i>&#xf079;</i></button>
			<CheckButton class="edit" content="<i>&#xf044;</i>" v-model="editMode" title="edit position" />
			<CheckButton class="fullscreen" content="<i>&#xf065;</i>" v-model="fullMode" />
		</footer>
		<audio ref="audioTa" :src="audioTa" />
		<audio ref="audioUnsheathed" :src="audioUnsheathed" />
		<audio ref="audioDong" :src="audioDong" />
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import Chess from "chess.js";
	import sha1 from "sha1";
	import {debounce} from "lodash";
	import color from "color";
	import Vue from "vue";
	import url from "url";
	import * as YAML from "yaml";

	import {msDelay, mutexDelay} from "../delay";
	import {downloadURL} from "../utils";
	import * as chessEngines from "../chessEngines";
	import * as chessCompactNotation from "../chessCompactNotation";

	import QuitCleaner from "../mixins/quit-cleaner";

	import CheckButton from "../components/check-button.vue";
	import StoreInput from "../components/store-input.vue";
	import BoolStoreInput from "../components/bool-store-input.vue";
	import Chart from "../components/chart.vue";
	import QRCode from "../components/qrcode.vue";

	import audioTa from "../assets/chess/concrete-ta.mp3";
	import audioDong from "../assets/chess/wood-ta.mp3";
	import audioUnsheathed from "../assets/chess/unsheathed.mp3";



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


	const coordinateXY = name => name && {
		x: name[0].charCodeAt(0) - "a".charCodeAt(0),
		y: Number(name[1]) - 1,
	};


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

		const fill = Number.isFinite(value) ? color.hsv([60 + 60 * Math.tanh(value / 8), 100, 80]).alpha(weight * .9 + .1).toString() : "#777a";

		return {x, y, angle, points, fill};
	};


	const winrateFromAnalyzationBest = (best, turn) => {
		const reversion = turn === "w" ? 1 : -1;

		let rate = 0;
		if (Number.isFinite(best.scoreMate))
			rate = reversion * Math.sign(best.scoreMate);
		else
			rate = reversion * Math.tanh(best.scoreCP / 400);

		return rate;
	};


	const PGN_WIDGETS = [
		{
			domain: "Chesscom",
			script: "javascript:navigator.clipboard.writeText([...document.querySelectorAll(\"vertical-move-list .move\")].map((move, i) => `${i+1}. ${move.querySelector(\".white\").textContent} ${move.querySelector(\".black\") ? move.querySelector(\".black\").textContent : ''}`).join(\" \"));alert('Chess notation text copied.');",
		},
	];


	const LIBRARY_DEFAULT_DEPTH = 26;
	const analyzationLibrary = {};



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
			QRCode,
		},


		data () {
			const winrateChartHeight = 240;

			return {
				editMode: false,
				fullMode: false,
				whiteOnTurn: true,
				orientationFlipped: false,
				setupPosition: null,
				history: [],
				fens: [],
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
				chosenWhitePlayer: null,
				chosenBlackPlayer: null,
				whitePlayerMoveTime: null,
				blackPlayerMoveTime: null,
				playerIsRunning: false,
				analyzation: null,
				winRateDict: {},
				winrateChartHeight,
				gameResult: null,
				PGN_WIDGETS,
				showNotationTips: false,
				showSharePanel: false,
				showArrowMarks: true,
				lastMove: null,
				checkSquare: null,
				chosenSquare: null,
				promotionPending: null,
				showPredictionBoard: false,
				hoverMove: null,
				hoverMovePoint: null,
				winrateChartData: {
					height: `${winrateChartHeight}px`,
					settings: {
						dimension: ["step"],
						metrics: ["rate"],
						xAxisType: "value",
						//animation: true,
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
						rows: [],
					},
					markLine: {
						animation: false,
						data: [],
					},
					animation: {animation: true},
					events: {
						click: this.onChartClick.bind(this),
					},
				},
				gameLinkCopied: false,
				markMove: null,
				audioTa,
				audioDong,
				audioUnsheathed,
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
				const items = this.analyzation.branches.map(item => ({...item})).filter(item => Number.isFinite(item.value));
				items.forEach((item, i) => {
					item.valueExp = Math.exp(item.value * 3);
					item.hash = item.move.filter(Boolean).join("");
					item.best = i === 0;
					item.marked = this.markMove && item.hash === this.markMove;
				});

				items.reverse();

				const expsum = items.reduce((sum, item) => sum + item.valueExp, 0);
				//console.log("expsum:", expsum);
				items.forEach(item => item.weight = item.marked ? 1 : item.valueExp / expsum);

				const noticableItems = items.filter((item, i) => item.weight > 1 / items.length || i < 3 || item.marked);

				items.forEach(item => item.arrow = moveToArrow(item.move[0], item.move[1], item.value, item.weight));

				return noticableItems;
			},


			winrateChartRows () {
				if (!this.winRates)
					return [];

				return this.winRates
					.map((item, step) => ({step, item}))
					.filter(({item}) => item)
					.map(({step, item}) => ({step: Number(step), rate: item.rate}));
			},


			promotionData () {
				if (!this.promotionPending)
					return null;

				const turn = this.whiteOnTurn ? "w" : "b";
				const position = coordinateXY(this.promotionPending.to);

				const downside = !!(this.orientationFlipped ^ (position.y === 0));

				const ps = ["Q", "N", "R", "B"];
				if (downside)
					ps.reverse();

				if (this.orientationFlipped) {
					position.x = 7 - position.x;
					position.y = 7 - position.y;
				}

				const left = position.x * this.checkerSize;
				const top = ((downside ? 5 : 8) - position.y) * this.checkerSize + (downside ? -12 : 0);

				return {
					downside,
					left,
					top,
					pieces: ps.map(p => ({
						notation: p.toLowerCase(),
						img: `chess/pieces/alpha/${turn}${p}.png`,
					})),
				};
			},


			targetSquares () {
				if (!this.chosenSquare || !this.game)
					return [];

				const moves = this.game.moves({verbose: true}).filter(move => move.from === this.chosenSquare && move.to);

				return moves
					.filter((move, i) => !moves.slice(0, i).find(m => m.to === move.to))	// remove repeated squares
					.map(move => ({
						name: move.to,
						pos: coordinateXY(move.to),
					}));
			},


			hoverMoveHash () {
				if (!this.hoverMove || !this.hoverMovePoint)
					return null;

				return `${this.hoverMove.hash}|${this.hoverMovePoint.x},${this.hoverMovePoint.y}`;
			},


			gameLink () {
				let link = location.origin + location.pathname + "#/chess-lab?";

				const queries = [];

				if (this.notation) {
					const code = chessCompactNotation.compressPGN(this.notation);
					//console.log("code:", code);
					//const pgn2 = chessCompactNotation.decompressToPGN(code);
					//console.log("pgn2:", pgn2);
					// TODO:

					//queries.push("notation=" + encodeURIComponent(this.notation));
					queries.push("n=" + encodeURIComponent(code));
				}

				if (this.currentHistoryIndex < this.history.length - 1)
					queries.push("step=" + this.currentHistoryIndex.toString());

				link += queries.join("&");

				return link;
			},


			playButtonTips () {
				if (this.playerIsRunning)
					return "Pause the player";
				else {
					if ((this.whiteOnTurn && this.chosenWhitePlayer) || (this.blackOnTurn && this.chosenBlackPlayer))
						return "Run the player";
					else
						return `Select an agent player for ${this.whiteOnTurn ? "white" : "black"} first`;
				}
			},


			currentMove () {
				return this.history[this.currentHistoryIndex];
			},


			winRates () {
				const rates = this.fens.map(fen => this.winRateDict[fen]).filter(Boolean);

				if (!this.analyzer && !rates.length)
					return null;

				return rates;
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

			this.fens = [this.game.fen()];

			const keyDownHandler = () => {
				switch (event.code) {
				case "ArrowLeft":
					this.undoMove();

					break;
				case "ArrowRight":
					this.redoMove();

					break;
				case "Home":
					this.seekHistory(-1);

					break;
				//default:
				//	console.debug("key code:", event.code);
				}
			};
			document.addEventListener("keydown", keyDownHandler);
			this.appendCleaner(() => document.removeEventListener("keydown", keyDownHandler));

			this.triggerAnalyzer = debounce(this.doTriggerAnalyzer.bind(this), 600);

			this.appendCleaner(() => this.analyzer && this.analyzer.terminate());

			this.loadOpenGame();
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

			this.predictionBoard = new Chessboard("prediction-board", {
				pieceTheme: "chess/pieces/alpha/{piece}.png",
			});

			document.querySelectorAll(".piece-417db").forEach(piece => piece.oncontextmenu = event => event.preventDefault());

			const hashData = this.parseLocationHash();

			if (hashData.n)
				this.notation = chessCompactNotation.decompressToPGN(hashData.n);

			if (hashData.notation)
				this.notation = hashData.notation;

			if (this.notation) {
				const pgn = this.notation;
				this.editMode = false;

				await this.$nextTick();
				this.loadNotation(pgn);
			}

			if (hashData.step)
				this.seekHistory(parseInt(hashData.step));

			this.onResize();
		},


		methods: {
			async onResize () {
				if (this.board)
					this.board.resize();

				this.asideWidth = this.$el.clientWidth > this.$refs.board.clientWidth ?
					(this.$el.clientWidth - this.$refs.board.clientWidth) / 2 : this.$el.clientWidth / 2;

				await this.$nextTick();

				const checker = this.$refs.board.querySelector(".board-b72b1");
				if (checker)
					this.checkerSize = checker.clientWidth / 8;

				await this.$nextTick();

				if (this.predictionBoard)
					this.predictionBoard.resize();

				this.$refs.winrateChart && this.$refs.winrateChart.getVChart().resize();

				if (this.$refs.winrate)
					this.winrateChartHeight = this.$refs.winrate.clientHeight;
			},


			onDragStart (source, piece /*position, orientation*/) {
				//console.log("onDragStart:", source, piece, position, orientation);

				if (this.editMode)
					return true;

				if (this.game.game_over())
					return false;

				//console.log("position:", source, piece, position);

				const movable = !!((this.game.turn() === "w") ^ /^b/.test(piece));

				if (movable)
					this.chosenSquare = this.chosenSquare === source ? null : source;

				return movable;
			},


			onDrop (source, target) {
				if (this.playMode)
					return this.move(source, target);
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


			promote (notation) {
				if (this.promotionPending) {
					this.game.move({
						from: this.promotionPending.from,
						to: this.promotionPending.to,
						promotion: notation,
					});
					this.promotionPending = null;

					this.updateStatus();
					this.syncBoard();

					this.$nextTick(() => this.runPlayer());
				}
			},


			move (from, to) {
				const moves = this.game.moves({verbose: true});
				const move = moves.find(move => move.from === from && move.to === to);

				// illegal move
				if (!move)
					return "snapback";

				if (move.promotion) {
					this.promotionPending = {from, to};
					return;
				}

				this.game.move(move);

				this.updateStatus();

				this.$nextTick(() => this.runPlayer());

				return "move";
			},


			targetMove (to) {
				//console.log("targetMove:", this.chosenSquare, to);
				if (this.chosenSquare) {
					if (this.move(this.chosenSquare, to) === "move")
						this.syncBoard();
				}
			},


			targetMark (to) {
				this.markMove = [this.chosenSquare, to].join("");
				this.chosenSquare = null;
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


			updateFens () {
				this.fens = [];

				const game = new Chess();
				if (this.notation)
					game.load_pgn(this.notation);

				let step = game.history().length;
				while (true) {
					this.fens[step] = game.fen();
					--step;

					if (!game.undo())
						break;
				}
			},


			updateStatus () {
				this.whiteOnTurn = this.game.turn() === "w";

				const history = this.game.history();
				if ((history.length % 2) ^ (!this.whiteOnTurn))
					history.unshift("...");

				if (!historyContains(this.history, history)) {
					this.history = history;
					this.notation = this.game.pgn();

					this.updateFens();
				}

				this.currentMoveIndex = Math.ceil(history.length / 2);

				this.analyzation = null;
				if (this.analyzer)
					this.triggerAnalyzer();

				this.gameResult = null;
				if (this.game.game_over()) {
					msDelay(200).then(() => {
						if (this.game.game_over())
							this.gameResult = this.game.in_draw() ? "draw" : (this.whiteOnTurn ? "black" : "white");
					});
				}

				const historyVerbose = this.game.history({verbose: true});
				const lastMove = historyVerbose.length ? historyVerbose[historyVerbose.length - 1] : null;
				this.lastMove = lastMove && {
					from: lastMove.from,
					to: lastMove.to,
					//from: coordinateXY(lastMove.from),
					//to: coordinateXY(lastMove.to),
				};

				this.checkSquare = null;
				if (this.game.in_check()) {
					const pieces = Object.entries(this.board.position());
					const item = pieces.find(([square, piece]) => square && piece === this.game.turn() + "K");
					if (item)
						this.checkSquare = item[0];
				}

				this.chosenSquare = null;
				this.markMove = null;
				this.showPredictionBoard = false;
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
				this.updateStatus();
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


			async onDropFiles (event) {
				this.drageHover = false;

				const file = event.dataTransfer.files[0];
				switch (file.type) {
				case "application/vnd.chess-pgn":
				case "text/plain":
				case "":
					const text = await file.readAs("Text");
					this.loadNotation(text);

					break;
				default:
					console.debug("Unsupported drop file type:", file.type);
				}
			},


			loadNotation (notation) {
				if (!this.game.load_pgn(notation)) {
					const [_, fen] = notation.match(/FEN "([^"]+)"/) || [];
					if (fen) {
						this.setupPosition = fen;
						this.game.load(fen);
					}
					else {
						console.debug("invalid PGN text:", notation);
						this.pgnBoxErrorActivated = true;
						return;
					}
				}

				this.history = [];

				this.syncBoard();
				this.updateStatus();

				if (this.analyzer)
					this.analyzer.newGame();

				this.pgnBoxInputActivated = true;

				if (this.analyzer)
					this.evaluateWinrateHistory();
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
					else {
						const fen = this.game.fen();

						if (analyzationLibrary[fen]) {
							this.analyzation = analyzationLibrary[fen];
							this.updateWinratesByAnalyzation(this.analyzation.best, this.currentHistoryIndex + 1);
						}
						else
							this.analyzer.analyze(fen);
					}
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
				}

				this.syncBoard();
				this.updateStatus();
			},


			async runPlayer () {
				if (!this.game.game_over()) {
					let move = null;
					if (this.whiteOnTurn && this.whitePlayer) {
						this.playerIsRunning = true;
						move = await this.whitePlayer.think(this.game.fen());
					}
					else if (!this.whiteOnTurn && this.blackPlayer) {
						this.playerIsRunning = true;
						move = await this.blackPlayer.think(this.game.fen());
					}

					if (move) {
						if (this.game.move({
							from: move[0],
							to: move[1],
							promotion: move[2],
						})) {
							this.syncBoard();
							this.updateStatus();

							msDelay(200).then(() => this.playerIsRunning && this.runPlayer());

							return;
						}
						else
							console.warn("Invalid move from agent:", move);
					}
				}

				this.playerIsRunning = false;
			},


			togglePlayer () {
				if (!this.playerIsRunning)
					this.runPlayer();
				else
					this.playerIsRunning = false;
			},


			async newGame () {
				if (this.game && !this.game.game_over() && this.history.length > 5) {
					if (!confirm("Start a new game?"))
						return;
				}

				this.editMode = true;
				await this.$nextTick();

				this.startPosition();
				this.editMode = false;
			},


			listenLogs (agent) {
				agent.on("log", data => {
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
			},


			async showPrediction (fen, path) {
				//console.log("showPrediction:", path, fen);
				this.predictionPreparing = true;

				document.body.classList.add("preparing-predict");

				const game = new Chess(fen);
				this.predictionBoard.position(fen);

				await msDelay(200);
				this.predictionPreparing = false;

				if (!this.hoverMove)
					return;

				this.showPredictionBoard = true;
				document.body.classList.remove("preparing-predict");

				await this.$nextTick();
				await msDelay(100);

				for (const move of path) {
					if (!this.showPredictionBoard)
						break;

					game.move({from: move[0], to: move[1], promotion: move[2]});
					this.predictionBoard.position(game.fen());

					await msDelay(800);
				}

				this.hoverMove = null;
			},


			onPredictionBlur () {
				//console.log("onPredictionBlur:", document.querySelectorAll("*:hover"));
				if (document.querySelector(".piece-417db:hover"))
					return;

				this.showPredictionBoard = false;
			},


			onHoverMovePointChange (move, event) {
				this.hoverMove = move;
				this.hoverMovePoint = {x: event.offsetX, y: event.offsetY};
			},


			updateWinratesByAnalyzation (best, stepIndex) {
				const fen = this.fens[stepIndex];
				console.assert(fen, "the current fen is null:", this.fens, stepIndex);

				const oldRate = this.winRateDict[fen];
				if (!oldRate || best.depth >= oldRate.depth) {
					const rate = winrateFromAnalyzationBest(best, stepIndex % 2 ? "b" : "w");

					Vue.set(this.winRateDict, fen, {
						depth: best.depth,
						rate,
					});
				}
			},


			async evaluateWinrateHistory (depth = 18) {
				const game = new Chess();
				if (this.setupPosition)
					game.load(this.setupPosition);

				for (let step = 0; step <= this.history.length; step++) {
					if (!this.analyzer)
						break;

					if (!this.winRates[step] || this.winRates[step].depth < depth) {
						const fen = game.fen();
						let best = null;
						if (analyzationLibrary[fen])
							best = analyzationLibrary[fen].best;
						else
							best = await this.analyzer.evaluateFinite(fen, depth);
						if (best)
							this.updateWinratesByAnalyzation(best, step);
					}

					if (step < this.history.length) {
						game.move(this.history[step]);
						if (game.game_over())
							break;
					}
				}

				console.log("History evaluation done.");
			},


			async playHistory (interval = 600) {
				while (this.currentHistoryIndex < this.history.length - 1) {
					this.redoMove();
					await msDelay(interval);
				}
			},


			copyGameLink () {
				navigator.clipboard.writeText(this.gameLink);
				this.gameLinkCopied = true;
			},


			parseLocationHash () {
				const hash = location.hash.substr(1);
				const hashurl = url.parse(hash, true);
				//console.log("hashurl:", hashurl);

				return hashurl.query;
			},


			onChartClick (event) {
				//console.log("onChartClick:", x);
				if (event.componentType === "series") {
					const x = event.value[0];
					if (x >= 0 && x <= this.history.length)
						this.seekHistory(x - 1);
				}
			},


			async loadAnalyzationLibrary (url) {
				const response = await fetch(url);
				if (!response.ok) {
					console.warn("analyzation library fetch failed:", response.statusText);
					return;
				}

				const parseMove = move => [move.substr(0, 2), move.substr(2, 4), move.length > 4 ? move.substr(4) : undefined];

				const text = await response.text();
				const records = YAML.parse(text);
				//console.log("analyzation library:", records);
				records.forEach(record => {
					const bestBranch = record.branches[0];

					analyzationLibrary[record.fen] = analyzationLibrary[record.fen] || {
						fen: record.fen,
						branches: record.branches.map(branch => ({
							move: parseMove(branch.move),
							pv: branch.pv.split(" ").map(parseMove),
							value: branch.score * 0.01,
						})),
						best: {
							move: parseMove(bestBranch.move),
							scoreCP: bestBranch.score,
							depth: bestBranch.depth || LIBRARY_DEFAULT_DEPTH,
						},
					};
				});

				console.debug("analyzation library loaded:", records.length);
			},


			async loadOpenGame () {
				const {default: openGame3} = await import("../assets/chess/open-games-3.yaml");
				await this.loadAnalyzationLibrary(openGame3);

				const {default: openGame4} = await import("../assets/chess/open-games-4.yaml");
				await this.loadAnalyzationLibrary(openGame4);
			},
		},


		watch: {
			whiteOnTurn () {
				this.editDirty = true;
			},


			editMode (value) {
				this.boardConfig.sparePieces = value;
				this.boardConfig.dropOffBoard = value ? "trash" : "snapback";

				if (value) {
					this.editDirty = false;
					this.lastMove = null;
					this.checkSquare = null;
					this.chosenSquare = null;
					this.markMove = null;
					this.promotionPending = null;
				}

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

					this.listenLogs(this.analyzer);
					this.analyzer.on("analyzation", analyzation => {
						if (analyzation.fen === this.game.fen()) {
							this.analyzation = analyzation;

							this.updateWinratesByAnalyzation(analyzation.best, this.currentHistoryIndex + 1);
						}
					});

					this.triggerAnalyzer();
				}
			},


			chosenWhitePlayer (value) {
				if (this.whitePlayer) {
					this.whitePlayer.terminate();
					this.whitePlayer = null;
				}

				if (value) {
					this.whitePlayer = chessEngines.players[value]();
					this.whitePlayer.movetime = this.whitePlayerMoveTime;
					this.listenLogs(this.whitePlayer);
				}
			},


			chosenBlackPlayer (value) {
				if (this.blackPlayer) {
					this.blackPlayer.terminate();
					this.blackPlayer = null;
				}

				if (value) {
					this.blackPlayer = chessEngines.players[value]();
					this.blackPlayer.movetime = this.blackPlayerMoveTime;
					this.listenLogs(this.blackPlayer);
				}
			},


			whitePlayerMoveTime (value) {
				if (this.whitePlayer)
					this.whitePlayer.movetime = value;
			},


			blackPlayerMoveTime (value) {
				if (this.blackPlayer)
					this.blackPlayer.movetime = value;
			},


			orientationFlipped (value) {
				if (this.board)
					this.board.orientation(value ? "black" : "white");

				if (this.predictionBoard)
					this.predictionBoard.orientation(value ? "black" : "white");
			},


			async lastMove (value) {
				document.querySelectorAll(".square-55d63.last-move").forEach(elem => elem.classList.remove("last-move", "from", "to"));
				if (value) {
					await msDelay(200);
					if (this.lastMove === value) {
						document.querySelector(`.square-${value.from}`).classList.add("last-move", "from");
						document.querySelector(`.square-${value.to}`).classList.add("last-move", "to");
					}
				}
			},


			checkSquare (value) {
				document.querySelectorAll(".square-55d63.checking").forEach(elem => elem.classList.remove("checking"));
				if (value)
					document.querySelector(`.square-${value}`).classList.add("checking");
			},


			chosenSquare (value) {
				document.querySelectorAll(".square-55d63.chosen").forEach(elem => elem.classList.remove("chosen"));
				if (value) {
					document.querySelector(`.square-${value}`).classList.add("chosen");
					this.markMove = null;
				}
			},


			async hoverMoveHash (value) {
				if (value) {
					if (document.querySelector(".piece-417db:hover"))
						return;

					if (await mutexDelay("hoverMoveHash.change", 600)) {
						if (this.predictionPreparing || this.showPredictionBoard || document.querySelector(".piece-417db:hover"))
							return;

						if (this.hoverMove)
							this.showPrediction(this.game.fen(), this.hoverMove.pv);
					}
				}
			},


			winrateChartHeight (value) {
				this.winrateChartData.height = `${value}px`;
			},


			currentHistoryIndex (value, oldValue) {
				Vue.set(this.winrateChartData.markLine.data, "0", {
					xAxis: value + 1,
				});

				if (value > oldValue && this.currentMove) {
					if (/x/.test(this.currentMove))
						this.$refs.audioDong.play();
					else
						this.$refs.audioTa.play();

					if (/[+#]$/.test(this.currentMove))
						this.$refs.audioUnsheathed.play();
				}
			},


			winrateChartRows (value) {
				this.winrateChartData.data.rows = value;
				//Vue.set(this.winrateChartData.data, "rows", value);
			},


			fullMode () {
				this.$nextTick(this.onResize.bind(this));
			},


			showSharePanel () {
				this.gameLinkCopied = false;
			},
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

	@media (max-aspect-ratio: 4/5)
	{
		aside
		{
			height: calc(100vh - 112vw) !important;
		}
	}

	@media (pointer: none), (pointer: coarse)
	{
		body > main
		{
			height: 100vh !important;
		}
	}

	.chess-lab.full-mode main
	{
		max-width: calc(min(100vw, 100vh) - 1px);
		max-height: calc(100vh - 1px);
	}

	.chess-lab.full-mode main .marks
	{
		top: 2px !important;
	}

	@media (max-aspect-ratio: 1/1)
	{
		.chess-lab.full-mode main
		{
			padding-top: calc(50vh - 50vw);
		}

		.chess-lab.full-mode main .marks
		{
			top: calc(50vh - 50vw + 2px) !important;
		}
	}

</style>

<style lang="scss">
	@import "../assets/fonts/icon-fas.css";


	.chess-lab
	{
		i
		{
			font-family: "IconFas";
			font-style: normal;
		}
	}

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

	.full-mode
	{
		.spare-pieces-7492f
		{
			height: 0;
		}
	}

	.square-55d63
	{
		&.last-move
		{
			filter: contrast(170%);

			&.white-1e1d7
			{
				filter: hue-rotate(-10deg) saturate(180%);
			}
		}

		&.last-move.to img
		{
			filter: drop-shadow(0 0 3px #000a);
		}

		&.checking
		{
			&.white-1e1d7
			{
				background-color: #f66;
			}

			&.black-3c85d
			{
				background-color: #800;
			}
		}

		&.chosen
		{
			&.white-1e1d7
			{
				background-color: #d0f3a5;
			}

			&.black-3c85d
			{
				background-color: #96ad2d;
			}
		}
	}

	#prediction-board
	{
		.black-3c85d
		{
			background-color: #638db5;
			color: #b5cff0;
		}

		.white-1e1d7
		{
			background-color: #b5cff0;
			color: #638db5;
		}
	}

	body.preparing-predict > .piece-417db
	{
		visibility: hidden;
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
		height: 100%;
		overflow: hidden;

		button
		{
			cursor: pointer;
		}

		button, .icon
		{
			font-size: 14px;
		}

		main
		{
			position: relative;
			margin: 0 auto;
			height: 100%;

			#board
			{
				height: 100%;
				width: 100%;
				background-color: #fff1;
			}

			#prediction-board
			{
				position: absolute;
				left: 0;
				top: calc(var(--checker-size) + 4px);
				width: var(--board-size);
				height: var(--board-size);
				overflow: hidden;
			}

			.marks
			{
				position: absolute;
				left: 2px;
				top: calc(var(--checker-size) + 6px);
				pointer-events: none;

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

				/*.last-move
				{
					rect
					{
						fill: transparent;
						stroke: #a00;
						stroke-width: 5px;
					}
				}*/

				.arrows
				{
					pointer-events: all;
					cursor: help;

					.move
					{
						&.best
						{
							stroke: #000a;
							stroke-width: 5px;
						}

						&.hover, &.marked.hover
						{
							stroke: #4fa2f0;
							stroke-width: 8px;
						}

						&.marked
						{
							stroke: #a84ff0;
							stroke-width: 8px;
						}
					}
				}

				.target-squares
				{
					pointer-events: all;

					rect
					{
						fill: #9fc67022;
					}

					circle
					{
						fill: #fff6;
					}
				}
			}

			.promotion
			{
				position: absolute;
				background-color: #777;
				border: 4px solid $button-active-color;
				border-radius: 4px;

				.piece
				{
					display: block;
					cursor: pointer;

					&:hover
					{
						background-color: $button-active-hover-color;
					}

					img
					{
						width: var(--checker-size);
						height: var(--checker-size);
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

			.fullscreen
			{
				position: absolute;
				left: -2em;
				bottom: .4em;
				opacity: 0;

				&:hover
				{
					opacity: 1;
				}
			}
		}

		aside
		{
			position: absolute;
			width: var(--aside-width);
			bottom: 0;
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
				font-size: 16px;
			}

			.engine
			{
				flex: 0 0 auto;
				padding: .4em;

				&.active select
				{
					background-color: $button-active-color;
					color: #fff;
				}

				& > * + *
				{
					margin-left: .6em;
				}
			}

			.players
			{
				p
				{
					margin: .6em;

					& > *
					{
						vertical-align: middle;
					}

					& > * + *
					{
						margin-left: .6em;
					}

					&.on
					{
						.icon
						{
							background-color: $button-active-color;
						}
					}
				}

				.icon
				{
					display: inline-block;
					width: 1.2em;
					height: 1.2em;
					background-size: contain;
					border-radius: .3em;
				}

				.white .icon
				{
					background-image: url(../assets/chess/wP.svg);
				}

				.black .icon
				{
					background-image: url(../assets/chess/bP.svg);
				}
			}

			.engine-logs
			{
				flex: 1 1 50vh;
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
				flex: 0 0.2 240px;
				padding: 0;
				position: relative;
				overflow: hidden;

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

		.logo-placeholder
		{
			display: inline-block;
			width: 30px;
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

			p
			{
				margin: .4em;
			}

			.comment
			{
				font-size: 14px;
				color: #777;
			}
		}

		.notation
		{
			flex: 0 0 auto;
			padding: 1em;
			display: flex;
			flex-direction: row;

			section
			{
				display: inline-block;
				flex: 0 0 auto;
				position: relative;
				margin: 0 .4em;

				.icon
				{
					cursor: pointer;

					&.on
					{
						color: #cfc;
					}
				}
			}

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

			.share
			{
				.panel
				{
					right: 0;
					text-align: center;

					p
					{
						white-space: nowrap;
					}

					button
					{
						margin: .2em;
					}

					.link
					{
						color: inherit;
						display: inline-block;
						max-width: 20em;
						overflow: hidden;
						font-size: 9px;

						&.activated
						{
							color: $button-active-hover-color;
							text-shadow: 0 0 2px #fff4;
							outline: 1px solid #cfc6;
						}
					}
				}
			}

			.help
			{
				.tips
				{
					top: 100%;
					right: 0;
					white-space: nowrap;

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
			background-position: center;

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

		@media (max-aspect-ratio: 4/5)
		{
			.logo-placeholder
			{
				display: none !important;
			}

			aside
			{
				font-size: 60%;
			}

			&.edit-mode
			{
				aside
				{
					display: none !important;
				}
			}

			footer
			{
				padding: 2px;

				button
				{
					margin: 1px;
				}
			}
		}

		&.full-mode
		{
			aside
			{
				visibility: hidden;
			}

			footer
			{
				width: 0;
				padding: 0;
			}

			#prediction-board
			{
				top: calc(50vh - 50vw);
			}
		}
	}
</style>
