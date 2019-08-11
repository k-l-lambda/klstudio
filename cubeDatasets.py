
import numpy as np
import tensorflow as tf



STATE_SIZE = 24 * 26


def readBytesFile(filename, shape):
	file = open(filename, 'rb')
	bytes = file.read()
	array = np.frombuffer(bytes, dtype = np.uint8)

	return array.reshape(shape)


def sparseVector(value, length):
	return [(1 if value == i else 0) for i in range(length)]


def loadStatesTwists():
	dataStates = readBytesFile('./data/cube3-solver-states.data', (-1, 26))
	dataTwists = readBytesFile('./data/cube3-solver-twists.data', (-1, 12))

	stateCount = len(dataTwists) // 12

	def gen():
		for s in range(stateCount):
			for t in range(12):
				input = sum(map((lambda state: sparseVector(state, 24)), dataStates[s]), []) + sparseVector(t, 12)
				result = dataTwists[s * 12][t]

				yield (input, result)

	return tf.data.Dataset.from_generator(gen, (tf.float32, tf.float32), (tf.TensorShape([STATE_SIZE + 12]), tf.TensorShape([])))
