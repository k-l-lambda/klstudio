<template>
	<div class="chess-lab" :class="{['edit-mode']: editMode, ['play-mode']: playMode}" v-resize="onResize" :style="{['--aside-width']: `${asideWidth}px`}">
		<main id="board" ref="board"></main>
		<aside class="left-sider"></aside>
		<aside class="right-sider">
			<ol class="move-list">

			</ol>
		</aside>
		<footer>
			<button v-if="playMode">&#x2b10;</button>
			<button v-if="playMode">&#x2b0e;</button>
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



	export default {
		name: "chess-lab",


		directives: {
			resize,
		},


		components: {
			CheckButton,
		},


		data () {
			return {
				editMode: true,
				whiteOnTurn: true,
				startFen: null,
				history: [],
				asideWidth: 200,
			};
		},


		computed: {
			playMode () {
				return !this.editMode;
			},


			fenPostfix () {
				const turn = this.whiteOnTurn ? "w" : "b";
				const castlings = "KQkq";
				const enpassant = "-";
				const clock = 0;
				const fullmoves = 1;

				return ` ${turn} ${castlings} ${enpassant} ${clock} ${fullmoves}`;
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
					this.board.position(this.game.fen());
			},


			flipOrientation () {
				if (this.board)
					this.board.flip();
			},


			startPosition () {
				if (this.board)
					this.board.start();
			},


			clearBoard () {
				if (this.board)
					this.board.clear();
			},


			updateStatus () {
				this.whiteOnTurn = this.game.turn() === "w";

				this.history = this.game.history();
				if ((this.history.length % 2) ^ (!this.whiteOnTurn))
					this.history.unshift("...");
			},
		},


		watch: {
			editMode (value) {
				this.boardConfig.sparePieces = value;
				this.boardConfig.dropOffBoard = value ? "trash" : "snapback";

				if (!value) {
					const fen = this.board.fen() + this.fenPostfix;
					const loaded = this.game.load(fen);
					//console.log("fen:", loaded, this.board.fen(), this.game.fen());
					if (!loaded) {
						console.warn("invalid editor position:", fen);
						this.editMode = true;
					}
					else {
						this.startFen = fen;
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
	}
</style>

<style lang="scss" scoped>
	$panel-background-color: #21201d;


	.chess-lab
	{
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
				background: url(../assets/chess/wP.svg);
			}

			&.off
			{
				background: url(../assets/chess/bP.svg);
			}
		}

		button
		{
			background-color: #383633;
			color: inherit;
			border: 0;
			border-radius: 8px;

			&.on
			{
				background-color: #7fa650;
				color: white;
			}

			&.turn.on
			{
				background-color: #383633;
				color: inherit;
			}
		}
	}
</style>
