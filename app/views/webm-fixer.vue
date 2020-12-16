<template>
	<div class="webm-fixer"
		:class="{'drag-hover': drageHover}"
		@dragover.prevent="drageHover = true"
		@dragleave="drageHover = false"
		@drop.prevent="onDropFiles"
	>

	</div>
</template>

<script>
	import ysFixWebmDuration from "../../inc/third-party/fix-webm-duration.js";
	import "../utils.js";



	export default {
		name: "webm-fixer",


		data () {
			return {
				drageHover: false,
			};
		},


		created () {
			//console.log("ysFixWebmDuration:", ysFixWebmDuration);
		},


		methods: {
			onDropFiles (event) {
				this.drageHover = false;

				const file = event.dataTransfer.files[0];
				//console.log("file:", file);

				if (file.type === "video/webm")
					this.fixFile(file);
			},


			async fixFile (file) {
				//const buffer = await file.readAs("ArrayBuffer");
				//const blob = new Blob([buffer]);
				const fixedBlob = await new Promise(resolve => ysFixWebmDuration(file, 10e+3, resolve));
				const url = URL.createObjectURL(fixedBlob);
				console.log("url:", url);
			},
		},
	};
</script>
 
 <style lang="scss" scoped>
	.webm-fixer
	{
		width: 100vw;
		height: 100vh;

		&.drag-hover
		{
			outline: 4px #4f4 solid;
			background-color: #cfc;
		}
	}
 </style>
