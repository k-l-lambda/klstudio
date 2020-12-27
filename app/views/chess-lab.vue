<template>
	<div class="chess-lab">
		<div id="board">

		</div>
	</div>
</template>

<script>



	export default {
		name: "chess-lab",


		async mounted () {
			if (!window.jQuery)
				window.jQuery = (await import("jquery")).default;
			if (!window.Chessboard)
				await import ("@chrisoakman/chessboardjs/dist/chessboard-1.0.0.js");
			const Chessboard = window.Chessboard;

			console.log("Chessboard:", Chessboard);
			this.board = new Chessboard("board", {
				draggable: true,
				dropOffBoard: "trash",
				sparePieces: true,
				pieceTheme: "/chesspieces/alpha/{piece}.png",
				position: "start",
			});
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
	}
</style>
