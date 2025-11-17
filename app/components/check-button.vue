<template>
	<button :class="`check-button ${classes} ${modelValue ? 'on' : 'off'}`" v-html="content" @click="onClick" :disabled="disabled"></button>
</template>

<script>

	export default {
		name: "check-button",

		compatConfig: {
			COMPONENT_V_MODEL: false,
		},

		props: {
			modelValue: Boolean,
			classes: {
				type: String,
				default: "",
			},
			content: String,
			disabled: Boolean,
		},


		methods: {
			onClick () {
				this.$emit("update:modelValue", !this.modelValue);
			},
		},
	};

</script>

<style scoped>
	.check-button:not([disabled])
	{
		cursor: pointer;
	}
</style>
