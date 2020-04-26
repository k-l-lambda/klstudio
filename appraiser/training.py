
import os
from dotenv import load_dotenv
import tensorflow as tf


load_dotenv(dotenv_path = './.env.local')
load_dotenv()

import models
import dataset
from plotUtils import plotImages, plotHistory



def train(model, y_col, batch_size = 16, epochs = 15, splitter = lambda name: name[0] == 'f', dataFilter = lambda df: df[df['score'] > 0]):
	trainingData, validationData = dataset.getDataFrames(splitter = splitter, dataFilter = dataFilter)

	trainGen = dataset.makeDataGenerator(trainingData, batch_size = batch_size, y_col = y_col, shuffle = True)
	validationGen = dataset.makeDataGenerator(validationData, batch_size = batch_size, y_col = y_col)


	#sample_images, sample_labels = next(validationGen)
	#print('labels:', sample_labels)
	#plotImages(sample_images)


	checkpoint_path = "./appraiser/training/cp-{epoch:04d}.h5"
	#checkpoint_dir = os.path.dirname(checkpoint_path)

	cp_callback = tf.keras.callbacks.ModelCheckpoint(
		filepath = checkpoint_path, 
		verbose = 1,
		save_weights_only = False,
		period = 1)


	history = model.fit_generator(
		trainGen,
		steps_per_epoch = len(trainingData.index) // batch_size,
		epochs = epochs,
		validation_data = validationGen,
		validation_steps = len(validationData.index) // batch_size,
		callbacks = [cp_callback],
	)
	#plotHistory(history, epochs)

	return history



# score regression
#model = models.simpleRegression
#model.compile(optimizer = 'adam', loss = 'mean_squared_error', metrics = ['mse'])

# classification6
model = models.xceptionClassification6
model.compile(optimizer = 'adam', loss = 'categorical_crossentropy', metrics = ['accuracy'])

model.summary()


#epochs = 16
#history = train(model, y_col = 'score')
#plotHistory(history, epochs, 'mean_squared_error')

epochs = 4
y_col = os.environ.get('TRAINER_CLASS_COLS').split(',')
history = train(model, y_col = y_col, batch_size = 2, epochs = epochs, dataFilter = lambda df: df)
plotHistory(history, epochs, 'acc')
