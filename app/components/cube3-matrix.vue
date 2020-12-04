<template>
	<table class="cube3-matrix">
		<thead>
			<tr>
				<th>&times;</th>
				<th v-for="ic of 8" :key="ic" class="corner">{{labels[ic - 1]}}</th>
				<th v-for="ie of 12" :key="ie + 8" class="edge">{{labels[ie + 7]}}</th>
				<th v-for="ia of 12" :key="ia + 20" class="axis">{{labels[ia + 19]}}</th>
			</tr>
		</thead>
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
		font-family: Verdana, Arial, Helvetica, sans-serif;
	}
</style>
