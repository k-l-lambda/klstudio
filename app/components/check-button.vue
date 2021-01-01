<template>
	<button :class="`check-button ${classes} ${value ? 'on' : 'off'}`" v-html="content" @click="onClick" :disabled="disabled"></button>
</template>

<script>

	export default {
		name: "check-button",


		props: {
			value: Boolean,
			classes: {
				type: String,
				default: "",
			},
			content: String,
			disabled: Boolean,
		},


		methods: {
			onClick () {
				this.$emit("input", !this.value);
			},
		},
	};

</script>

<style scoped>
	.check-button
	{
		cursor: pointer;
	}
</style>
