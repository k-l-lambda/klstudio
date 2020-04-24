
console.log("index.js start.");

import * as tf from '@tensorflow/tfjs';
import * as tsne from '@tensorflow/tfjs-tsne';
//console.log("tsne:", tf, tsne);

// Create some data
const data = tf.randomUniform([100, 40]);
console.log("data:", data);

// Initialize the tsne optimizer
const tsneOpt = tsne.tsne(data);

// Compute a T-SNE embedding, returns a promise.
// Runs for 1000 iterations by default.
tsneOpt.compute().then(() => {
	// tsne.coordinate returns a *tensor* with x, y coordinates of
	// the embedded data.
	const coordinates = tsneOpt.coordinates();
	coordinates.print();

	console.log("done:", coordinates);
});
console.log("computing.");
