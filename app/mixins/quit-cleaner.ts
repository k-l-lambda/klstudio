
export default {
	created () {
		this.quitCleaner = new Promise(resolve => this.quitClear = resolve);
	},


	methods: {
		appendCleaner (cleaner) {
			this.quitCleaner = this.quitCleaner.then(cleaner);
		},
	},


	beforeDestroy () {
		this.quitClear();
	},
};
