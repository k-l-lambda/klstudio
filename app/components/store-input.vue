<template>
	<input
		:type="type"
		:value="modelValue"
		@input="onInput"
		:style="styleObj"
		:placeholder="placeholder"
		:min="range && range.min"
		:max="range && range.max"
		:step="range && range.step"
	/>
</template>

<script>
	export default {
		name: "store-input",

		compatConfig: {
			COMPONENT_V_MODEL: false,
		},

		props: {
			type: {
				type: String,
				default: "text",
			},

			modelValue: {
				validator () {
					return true;
				},
			},

			range: Object,

			styleObj: Object,

			placeholder: String,

			localKey: String,
			sessionKey: String,
		},


		created () {
			this.load();
		},


		methods: {
			onInput (event) {
				const value = event.target.value;
				this.$emit("update:modelValue", value);
			},

			load () {
				if (this.localKey && localStorage[`storeInput-${this.localKey}`]) {
					const value = JSON.parse(localStorage[`storeInput-${this.localKey}`]);
					this.$emit("update:modelValue", value);
				}

				if (this.sessionKey && sessionStorage[`storeInput-${this.sessionKey}`]) {
					const value = JSON.parse(sessionStorage[`storeInput-${this.sessionKey}`]);
					this.$emit("update:modelValue", value);
				}
			},


			save () {
				if (this.localKey)
					localStorage[`storeInput-${this.localKey}`] = JSON.stringify(this.modelValue);

				if (this.sessionKey)
					sessionStorage[`storeInput-${this.sessionKey}`] = JSON.stringify(this.modelValue);
			},
		},


		watch: {
			modelValue: "save",
		},
	};
</script>
