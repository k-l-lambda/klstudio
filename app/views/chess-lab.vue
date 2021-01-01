<template>
	<div class="chess-lab" v-resize="onResize">
		<div id="board"></div>
		<div class="players"></div>
		<div class="footer">
			<CheckButton v-if="!editMode" class="turn" v-model="whiteOnTurn" />
			<CheckButton class="edit" content="&#x1F58A;" v-model="editMode" />
		</div>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

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
				editMode: false,
				whiteOnTurn: true,
			};
		},


		async mounted () {
			if (!window.jQuery)
				window.jQuery = (await import("jquery")).default;
			if (!window.Chessboard)
				await import ("@chrisoakman/chessboardjs/dist/chessboard-1.0.0.js");
			const Chessboard = window.Chessboard;

			//console.log("Chessboard:", Chessboard);
			this.board = new Chessboard("board", {
				draggable: true,
				dropOffBoard: "trash",
				sparePieces: true,
				pieceTheme: "/chesspieces/alpha/{piece}.png",
				position: "start",
			});
		},


		methods: {
			onResize () {
				if (this.board)
					this.board.resize();
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

<style lang="scss" scoped>
	.chess-lab
	{
		.footer
		{
			position: absolute;
			right: 0;
			bottom: 0;

			& > button
			{
				margin: 0 .2em;
				font-size: 30px;
				vertical-align: middle;
			}
		}

		.players
		{
			position: absolute;
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

		button.edit
		{
			&.on
			{
				background-color: #cfc;
			}
		}
	}
</style>
