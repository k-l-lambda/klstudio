<template>
	<div v-resize="onResize" class="spiral-piano">
		<svg class="canvas">
			<defs>
				<filter id="filter-brilliancy">
					<feColorMatrix type="saturate" values="1.2"/>
				</filter>
				<filter id="filter-middle-saturate">
					<feColorMatrix type="saturate" values="0.7"/>
				</filter>
				<filter id="filter-grey">
					<feColorMatrix type="saturate" values="0.04"/>
				</filter>
				<filter id="filter-brightness-n4">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.4" slope="1"/>
						<feFuncG type="linear" intercept="-0.4" slope="1"/>
						<feFuncB type="linear" intercept="-0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n3">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.3" slope="1"/>
						<feFuncG type="linear" intercept="-0.3" slope="1"/>
						<feFuncB type="linear" intercept="-0.3" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n2">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.2" slope="1"/>
						<feFuncG type="linear" intercept="-0.2" slope="1"/>
						<feFuncB type="linear" intercept="-0.2" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n1">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.1" slope="1"/>
						<feFuncG type="linear" intercept="-0.1" slope="1"/>
						<feFuncB type="linear" intercept="-0.1" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-1">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.1" slope="1"/>
						<feFuncG type="linear" intercept="0.1" slope="1"/>
						<feFuncB type="linear" intercept="0.1" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-2">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.2" slope="1"/>
						<feFuncG type="linear" intercept="0.2" slope="1"/>
						<feFuncB type="linear" intercept="0.2" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-3">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.3" slope="1"/>
						<feFuncG type="linear" intercept="0.3" slope="1"/>
						<feFuncB type="linear" intercept="0.3" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-4">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.4" slope="1"/>
						<feFuncG type="linear" intercept="0.4" slope="1"/>
						<feFuncB type="linear" intercept="0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-5">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.4" slope="1"/>
						<feFuncG type="linear" intercept="0.4" slope="1"/>
						<feFuncB type="linear" intercept="0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
			</defs>
			<g class="regions"></g>
			<g class="labels"></g>
			<g class="keys">
				<g class="labels"></g>
				<g class="groups"></g>
			</g>
		</svg>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";



	export default {
		name: "spiral-piano",


		directives: {
			resize,
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},
		},
	};
</script>

<style>
</style>
