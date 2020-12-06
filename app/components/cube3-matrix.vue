<template>
	<table class="cube3-matrix" :class="{
			'hide-corners': !showCorners,
			'hide-edges': !showEdges,
			'hide-axes': !showAxes,
		}"
		@mouseleave="focusColumn = focusRow = null"
	>
		<thead>
			<tr>
				<th class="corner-cell"></th>
				<th v-for="i of 26" :key="i" :class="{corner: i <= 8, edge: i > 8 && i <= 20, axis: i > 20, focus: i === focusColumn}">{{labels[i - 1]}}</th>
			</tr>
		</thead>
		<tbody v-if="matrix">
			<tr v-for="j of 26" :key="j"
				:class="{
					corner: j <= 8, edge: j > 8 && j <= 20, axis: j > 20,
					focus: j === focusRow,
					activated: activatedRows[j - 1],
				}"
			>
				<th class="column">{{labels[j - 1]}}</th>
				<td v-for="i of 26" :key="i"
					:class="{corner: i <= 8, edge: i > 8 && i <= 20, axis: i > 20, focus: i === focusColumn}"
					v-html="matrix[j - 1][i - 1]"
					@mouseenter="focusColumn = i; focusRow = j"
				></td>
			</tr>
		</tbody>
	</table>
</template>

<script>
	import {CUBE3_POSITION_LABELS} from "../../inc/latin-letters";
	import {GREEK_LETTERS, ORIENTATION_GREEK_LETTER_ORDER} from "../../inc/greek-letters";
	import {msDelay} from "../delay";



	const A = "A".charCodeAt(0);
	const CUBE3_POSITION_LABELS_NUMBERS = CUBE3_POSITION_LABELS.split("").map(char => char.charCodeAt(0) - A);

	const CUBE3_POSITION_INDICES = Array(26).fill().map((_, i) => CUBE3_POSITION_LABELS_NUMBERS.indexOf(i)).map(index => index > 12 ? index + 1 : index);



	export default {
		name: "cube3-matrix",


		props: {
			cube: Object,
			showCorners: {
				type: Boolean,
				default: true,
			},
			showEdges: {
				type: Boolean,
				default: true,
			},
			showAxes: {
				type: Boolean,
				default: true,
			},
		},


		data () {
			return {
				labels: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
				vector: null,
				matrix: null,
				focusColumn: null,
				focusRow: null,
				activatedRows: Array(26).fill(false),
			};
		},


		/*computed: {
			columnVector () {
				if (!this.cube)
					return null;

				const positions = Array.from(this.cube.positions);

				return CUBE3_POSITION_INDICES.map(index => CUBE3_POSITION_INDICES.indexOf(positions[index]));
			},


			matrix () {
				return this.columnVector && this.columnVector.map((index, j) => Array(26).fill().map((_, i) => i === index ? GREEK_LETTERS[ORIENTATION_GREEK_LETTER_ORDER[this.cube.units[j]]] : ""));
			},
		},*/


		created () {
			this.updateMatrix();
		},


		methods: {
			updateMatrix () {
				if (!this.cube)
					return null;

				const positions = Array.from(this.cube.positions);

				const positionVector = CUBE3_POSITION_INDICES.map(index => CUBE3_POSITION_INDICES.indexOf(positions[index]));

				this.vector = positionVector.map((_, j) => this.cube.units[CUBE3_POSITION_INDICES[j]]);

				this.matrix = positionVector.map((index, j) => Array(26).fill().map((_, i) =>
					i === index ? GREEK_LETTERS[ORIENTATION_GREEK_LETTER_ORDER[this.vector[j]]] : ""));

				//console.log("matrix:", positions, vector, [...this.cube.units]);
			},
		},


		watch: {
			async vector (value, oldValue) {
				if (value && oldValue)
					this.activatedRows = value.map((o, i) => o !== oldValue[i]);

				await msDelay(100);
				this.activatedRows = Array(26).fill(false);
			},
		},
	};
</script>

<style lang="scss" scoped>
	$boldBolderColor: #fff6;


	table
	{
		text-align: center;
		font-family: monospace;
		border-collapse: collapse;

		td, th
		{
			width: 1em;
			line-height: 1em;
			padding: 0 .2em;
		}

		th.column
		{
			color: red;
		}

		tr.focus td, td.focus
		{
			background-color: #000f;
		}

		th
		{
			overflow: hidden;
		}

		.corner-cell
		{
			font-size: 100%;
			&::before
			{
				content: "X";
				visibility: hidden;
			}
		}

		td
		{
			background-color: #000e;
			color: white;
			text-shadow: white 0 0 12px;
			border: #fff1 1px solid;
			font-weight: bold;
		}

		tr:nth-child(8), tr:nth-child(20)
		{
			td
			{
				border-bottom-color: $boldBolderColor;
			}
		}

		td:nth-child(9), td:nth-child(21)
		{
			border-right-color: $boldBolderColor;
		}

		&:hover
		{
			th
			{
				font-weight: normal;
				font-size: 80%;
				overflow: hidden;
			}

			td
			{
				font-weight: normal;
				text-shadow: none;
				background-color: #000d;
			}

			tr.focus th, th.focus
			{
				font-weight: bold;
				font-size: 100%;
			}

			tr.focus td, td.focus
			{
				font-weight: bold;
				text-shadow: white 0 0 12px;
				background-color: black;
			}

			td, th
			{
				transition-duration: .1s;
			}
		}

		tr
		{
			td
			{
				transition: background-color .6s ease-out;
			}

			th
			{
				transition: color .6s ease-out;
			}

			&.activated
			{
				td
				{
					background-color: #440;
					transition: background-color .01s;
				}

				th
				{
					color: gold;
					transition: color .01s;
				}
			}
		}
	}
</style>
