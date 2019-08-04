
import sys

import numpy as np



def readBytesFile(filename, shape):
	file = open(filename, 'rb')
	bytes = file.read()
	array = np.frombuffer(bytes, dtype = np.uint8)

	return array.reshape(shape)


def main(argv):
	dataLength = readBytesFile('./data/cube3-solver-length.data', (-1, 1))
	dataState = readBytesFile('./data/cube3-solver-states.data', (-1, 24 * 26))

	print('read:', dataLength.shape, dataState.shape)



if __name__ == "__main__":
	main(sys.argv)
