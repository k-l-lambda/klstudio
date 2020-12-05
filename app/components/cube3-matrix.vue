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
				:class="{corner: j <= 8, edge: j > 8 && j <= 20, axis: j > 20, focus: j === focusRow}"
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
				matrix: null,
				focusColumn: null,
				focusRow: null,
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

				const vector = CUBE3_POSITION_INDICES.map(index => CUBE3_POSITION_INDICES.indexOf(positions[index]));

				this.matrix = vector.map((index, j) => Array(26).fill().map((_, i) =>
					i === index ? GREEK_LETTERS[ORIENTATION_GREEK_LETTER_ORDER[this.cube.units[CUBE3_POSITION_INDICES[j]]]] : ""));

				//console.log("matrix:", positions, vector, [...this.cube.units]);
			},
		},
	};
</script>

<style lang="scss" scoped>
	table
	{
		text-align: center;
		font-family: monospace;
		border-collapse: collapse;

		td, th
		{
			width: 1em;
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
			font-weight: normal;
			font-size: 80%;
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

		tr.focus th, th.focus
		{
			font-weight: bold;
			font-size: 100%;
		}

		td
		{
			background-color: #000d;
			color: white;
			text-shadow: white 0 0 12px;
			border: #fff1 1px solid;
			font-weight: bold;
		}
	}
</style>
