
import os
import os.path as path
import pandas as pd
from tensorflow.keras.preprocessing.image import ImageDataGenerator



DATASET_PATH = os.environ.get('DATASET_PATH')
IMAGE_DIMENSION = int(os.environ.get('IMAGE_DIMENSION'))


def getDataFrames(splitter):
	filenames = [f for f in os.listdir(DATASET_PATH) if path.isfile(path.join(DATASET_PATH, f))]
	filenamesTraining = filter(lambda name: not splitter(name), filenames)
	filenamesValidation = filter(splitter, filenames)

	dataframe = pd.read_csv('./footages/labels.csv')
	dataframe = dataframe[dataframe['score'] > 0]
	dataframe['filename'] = [hash + ".jpg" for hash in dataframe.hash]

	trainingData = dataframe[dataframe.filename.isin(filenamesTraining)]
	validationData = dataframe[dataframe.filename.isin(filenamesValidation)]

	return trainingData, validationData


def makeDataGenerator(dataframe, **kwargs):
	return ImageDataGenerator(rescale = 1./255).flow_from_dataframe(dataframe,
		directory = DATASET_PATH,
		x_col = 'filename',
		y_col = 'score',
		target_size = (IMAGE_DIMENSION, IMAGE_DIMENSION),
		class_mode = 'other',
		**kwargs,
		)
