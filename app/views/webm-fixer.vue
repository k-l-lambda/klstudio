<template>
	<div class="webm-fixer"
		:class="{'drag-hover': drageHover}"
		@dragover.prevent="drageHover = true"
		@dragleave="drageHover = false"
		@drop.prevent="onDropFiles"
	>
		<main>
			<video v-if="videoURL" ref="video" controls
				:src="videoURL"
				@loadedmetadata="onVideoLoadMeta"
				@seeked="onVideoSeeked"
			/>
			<p><a v-if="fixedURL" :download="fileName" :href="fixedURL">{{fileName}}</a></p>
		</main>
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
				videoURL: null,
				fixedURL: null,
				fileName: null,
			};
		},


		methods: {
			onDropFiles (event) {
				this.drageHover = false;
				this.fixedURL = null;
				this.fileName = null;

				const file = event.dataTransfer.files[0];
				//console.log("file:", file);

				if (file.type === "video/webm")
					this.fixFile(file);
			},


			async fixFile (file) {
				//const buffer = await file.readAs("ArrayBuffer");
				//const blob = new Blob([buffer]);
				this.videoURL = URL.createObjectURL(file);
				await new Promise(resolve => this.onLoadMetaCallback = resolve);

				//console.log("video:", this.$refs.video.duration);
				if (!Number.isFinite(this.$refs.video.duration)) {
					this.$refs.video.currentTime = 1e+9;
					await new Promise(resolve => this.onSeekedCallback = resolve);
					console.debug("duration:", this.$refs.video.duration);

					if (!Number.isFinite(this.$refs.video.duration)) {
						console.warn("Did not get a valid duration:", this.$refs.video.duration);
						return;
					}

					const fixedBlob = await new Promise(resolve => ysFixWebmDuration(file, this.$refs.video.duration * 1e+3, resolve));
					this.fixedURL = URL.createObjectURL(fixedBlob);
					this.fileName = file.name.replace(/\.\w+$/, "") + "-fixed.webm";
					//console.debug("url:", this.fixedURL);

					//downloadURL(url, file.name + "fixed.webm");
				}
				else
					console.log("Duation is valid, no need to fix:", this.$refs.video.duration);
			},


			onVideoLoadMeta () {
				if (this.onLoadMetaCallback) {
					this.onLoadMetaCallback();
					this.onLoadMetaCallback = null;
				}
			},


			onVideoSeeked () {
				if (this.onSeekedCallback) {
					this.onSeekedCallback();
					this.onSeekedCallback = null;
				}
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

		main
		{
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);

			video
			{
				width: 640px;
			}
		}
	}
 </style>
