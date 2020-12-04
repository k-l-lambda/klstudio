<template>
	<table class="cube3-matrix" :class="{
		'hide-corners': !showCorners,
		'hide-edges': !showEdges,
		'hide-axes': !showAxes,
	}">
		<thead>
			<tr>
				<th>&times;</th>
				<th v-for="i of 26" :key="i" :class="{corner: i <= 8, edge: i > 8 && i <= 20, axis: i > 20}">{{labels[i - 1]}}</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="i of 26" :key="i" :class="{corner: i <= 8, edge: i > 8 && i <= 20, axis: i > 20}">
				<th class="column">{{labels[i - 1]}}</th>
				<td v-for="i of 26" :key="i" :class="{corner: i <= 8, edge: i > 8 && i <= 20, axis: i > 20}"></td>
			</tr>
		</tbody>
	</table>
</template>

<script>
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
			};
		},


		computed: {

		},
	};
</script>

<style lang="scss" scoped>
	table
	{
		text-align: center;
		font-family: monospace;

		td, th
		{
			width: 1em;
			padding: 0 .2em;
		}

		th.column
		{
			color: red;
		}
	}
</style>
