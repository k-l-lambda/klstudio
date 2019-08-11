
import sys

#import numpy as np
import tensorflow as tf

import cubeDatasets



STATE_SIZE = 24 * 26


def trainAndSaveModel(dataset, modelName):
	#print('read:', dataLength.shape, dataState.shape)
	model = tf.keras.Sequential([
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu', input_shape = (STATE_SIZE + 12,)),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(STATE_SIZE + 12, activation = 'relu'),
		tf.keras.layers.Dense(1),
	])

	model.compile(
		optimizer = tf.keras.optimizers.SGD(lr = 0.01),
		loss = 'binary_crossentropy',
		metrics = ['accuracy']
	)

	model.fit(dataset, epochs = 10, steps_per_epoch = 10000)

	model.save('./models/%s.h5' % modelName)


def main(argv):
	'''dataLength = readBytesFile('./data/cube3-solver-length.data', (-1, 1))
	dataState = readBytesFile('./data/cube3-solver-states.data', (-1, STATE_SIZE))

	dataset = tf.data.Dataset.from_tensor_slices((dataState, dataLength)).shuffle(1).repeat().batch(32)'''
	dataset = cubeDatasets.loadStatesTwists().shuffle(1024).repeat().batch(32)

	trainAndSaveModel(dataset, "cube-solver")



if __name__ == "__main__":
	main(sys.argv)
