
import sys

import numpy as np
import tensorflow as tf



def readBytesFile(filename, shape):
	file = open(filename, 'rb')
	bytes = file.read()
	array = np.frombuffer(bytes, dtype = np.uint8)

	return array.reshape(shape)


def main(argv):
	STATE_SIZE = 24 * 26

	dataLength = readBytesFile('./data/cube3-solver-length.data', (-1, 1))
	dataState = readBytesFile('./data/cube3-solver-states.data', (-1, STATE_SIZE))

	#print('read:', dataLength.shape, dataState.shape)
	# 0.0111
	'''	tf.keras.layers.Dense(24 * 13, activation = 'relu', input_shape = (STATE_SIZE,)),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(13, activation = 'relu'),'''
	# tf.keras.layers.Dense(STATE_SIZE, activation = 'relu') * 9
	# 0.0065
	# tf.keras.layers.Dense(STATE_SIZE, activation = 'relu') * 2
	# 0.0648
	# tf.keras.layers.Dense(STATE_SIZE, activation = 'relu') * 5
	# 0.0051
	# tf.keras.layers.Dense(STATE_SIZE, activation = 'relu') * 18
	# 0.0099
	model = tf.keras.Sequential([
		tf.keras.layers.Dense(STATE_SIZE, activation = 'relu', input_shape = (STATE_SIZE,)),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(12 * 13, activation = 'relu'),
		tf.keras.layers.Dense(1),
	])

	model.compile(
		optimizer = tf.keras.optimizers.SGD(lr = 0.01),
		loss = 'mean_squared_error',
		metrics = ['accuracy']
	)

	model.fit(dataState, dataLength, epochs = 10, batch_size = 32)



if __name__ == "__main__":
	main(sys.argv)
