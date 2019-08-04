
import sys

import numpy as np
import tensorflow as tf



STATE_SIZE = 24 * 26


def readBytesFile(filename, shape):
	file = open(filename, 'rb')
	bytes = file.read()
	array = np.frombuffer(bytes, dtype = np.uint8)

	return array.reshape(shape)


def trainAndSaveModel(dataset, modelName):
	#print('read:', dataLength.shape, dataState.shape)
	model = tf.keras.Sequential([
		tf.keras.layers.Dense(STATE_SIZE, activation = 'relu', input_shape = (STATE_SIZE,)),
		tf.keras.layers.Dense(STATE_SIZE, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE, activation = 'relu'),
		tf.keras.layers.Dense(1),
	])

	model.compile(
		optimizer = tf.keras.optimizers.SGD(lr = 0.01),
		loss = 'mean_squared_error',
		metrics = ['mse']
	)

	model.fit(dataset, epochs = 10, steps_per_epoch = 10000)

	model.save_weights('./models/%s.h5' % modelName, save_format = 'h5')


def main(argv):
	dataLength = readBytesFile('./data/cube3-solver-length.data', (-1, 1))
	dataState = readBytesFile('./data/cube3-solver-states.data', (-1, STATE_SIZE))

	dataset = tf.data.Dataset.from_tensor_slices((dataState, dataLength)).shuffle(1).repeat().batch(32)

	trainAndSaveModel(dataset, "cube-solver")



if __name__ == "__main__":
	main(sys.argv)
