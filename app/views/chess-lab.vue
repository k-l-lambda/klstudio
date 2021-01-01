<template>
	<div class="chess-lab" :class="{['edit-mode']: editMode, ['play-mode']: playMode}" v-resize="onResize" :style="{['--aside-width']: `${asideWidth}px`}">
		<StoreInput v-show="false" v-model="notation" sessionKey="chessLab.notation" />
		<main id="board" ref="board"></main>
		<aside class="left-sider"></aside>
		<aside class="right-sider">
			<table class="move-list">
				<tbody>
					<tr v-for="move of moveList" :key="move.index">
						<th>{{move.index}}.</th>
						<td :class="{current: move.index === currentMoveIndex && blackOnTurn}">{{move.w}}</td>
						<td :class="{current: move.index === currentMoveIndex && whiteOnTurn}">{{move.b}}</td>
					</tr>
				</tbody>
			</table>
		</aside>
		<footer>
			<button v-if="playMode" @click="undoMove">&#x2b10;</button>
			<button v-if="playMode" @click="redoMove">&#x2b0e;</button>
			<button v-if="editMode" @click="clearBoard">&#x1f5d1;</button>
			<button v-if="editMode" @click="startPosition">&#x1f3e0;</button>
			<CheckButton class="turn" v-model="whiteOnTurn" :disabled="playMode" />
			<button @click="flipOrientation">&#x1f503;</button>
			<CheckButton class="edit" content="&#x1F58A;" v-model="editMode" />
		</footer>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import Chess from "chess.js";

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



	export default {
		name: "chess-lab",


		directives: {
			resize,
		},


		components: {
			CheckButton,
			StoreInput,
		},


		data () {
			return {
				editMode: true,
				whiteOnTurn: true,
				setupPosition: null,
				history: [],
				asideWidth: 200,
				notation: null,
				currentMoveIndex: 0,
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
		},


		created () {
			this.boardConfig = {
				draggable: true,
				dropOffBoard: "trash",
				sparePieces: true,
				pieceTheme: "/chesspieces/alpha/{piece}.png",
				position: "start",
				onDragStart: this.onDragStart.bind(this),
				onDrop: this.onDrop.bind(this),
				onSnapEnd: this.onSnapEnd.bind(this),
			};

			this.game = new Chess();
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
				this.game.load_pgn(pgn);
				this.syncBoard();
				this.updateStatus();
			}
		},


		methods: {
			onResize () {
				if (this.board) {
					this.board.resize();

					this.asideWidth = (window.innerWidth - this.$refs.board.clientWidth) / 2;
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
			},


			onSnapEnd () {
				//console.log("fen:", this.game.fen());
				if (this.playMode)
					this.syncBoard();

				if (this.editMode)
					this.editDirty = true;
			},


			flipOrientation () {
				if (this.board)
					this.board.flip();
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

				if (!historyContains(this.history, history))
					this.history = history;

				this.currentMoveIndex = Math.ceil(history.length / 2);

				this.notation = this.game.pgn();
			},


			undoMove () {
				this.game.undo();
				this.syncBoard();
				this.updateStatus();
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
						this.updateStatus();
					}
				}
			},
		},
	};
</script>

<style>
	@import "../third-party/chessboard-1.0.0.css";

	#board
	{
		max-width: min(100vw, 80vh);
		max-height: 100vh;
		margin: 0 auto;
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


	.chess-lab
	{
		font-family: Segoe UI, "Helvetica Neue", Helvetica, Arial, sans-serif;
		background-color: #312e2b;
		color: #b7b7b7;

		#board
		{
			background-color: #fff1;
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
		}

		.move-list
		{
			font-size: 13px;
			margin: 2em 0;

			th
			{
				font-weight: normal;
				width: 1em;
				padding: 0 1em;
				text-align: right;
				user-select: none;
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
				}

				&:hover
				{
					background-color: #aaa2;
				}
			}
		}

		.left-sider
		{
			left: 0;
		}

		.right-sider
		{
			right: 0;
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
			cursor: pointer;

			&:hover
			{
				background-color: $button-hover-color;
			}

			&.on
			{
				background-color: $button-active-color;
				color: white;

				&:hover
				{
					background-color: $button-active-hover-color;
				}
			}

			&.turn
			{
				background-color: $button-color;
				color: inherit;

				&:hover
				{
					background-color: $button-hover-color;
				}
			}
		}
	}
</style>
