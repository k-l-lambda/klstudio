
import * as fs from "fs";

//import * as tf from "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-node-gpu";



const main = async () => {
	const dataLength = fs.readFileSync("./static/cube3-solver-length.data");
	const dataTwist = fs.readFileSync("./static/cube3-solver-twist.data");
	const dataStates = fs.readFileSync("./static/cube3-solver-states.data");
	
	
	const stateSize = 24 * 26;
	const sampleCount = dataStates.length / stateSize;
	const states = [];
	for (let i = 0; i < sampleCount; ++i)
		states.push(dataStates.slice(i * stateSize, (i + 1) * stateSize));
	
	
	const datasetLength = tf.data.array([...dataLength]);
	const datasetTwist = tf.data.array([...dataTwist]);
	const datasetState = tf.data.array(states);
	
	
	const lengthPredictorDataset = tf.data.zip({xs: datasetState, ys: datasetLength})
		.batch(0x10)
		.shuffle(sampleCount)
		;
	
	
	const lengthPredictorModel = tf.sequential({
		layers: [
			tf.layers.dense({units: stateSize, inputShape: [stateSize], activation: "relu"}),
			/*tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),
			tf.layers.dense({units: stateSize, activation: "relu"}),*/
			tf.layers.dense({units: 1}),
		],
	});
	lengthPredictorModel.compile({optimizer: 'sgd', loss: 'meanSquaredError'});
	
	
	console.log("Training...");
	const history = await lengthPredictorModel.fitDataset(lengthPredictorDataset, {
		batchesPerEpoch: 10,
		epochs: 1,
		callbacks: {
			onBatchEnd(batch, logs) {
				console.log("onBatchEnd:", batch, logs);

				return Promise.resolve();
			}
		},
		//tf.node.tensorBoard("./tmp/fit_logs_1"),
	});
	
	
	
	console.log("Finished.");
};

main();
