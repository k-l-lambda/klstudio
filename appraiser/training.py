
#import os
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import tensorflow as tf


load_dotenv(dotenv_path = './.env.local')
load_dotenv()

from models import model
import dataset



def plotImages(images_arr):
	_, axes = plt.subplots(1, 5, figsize = (20, 20))
	axes = axes.flatten()
	for img, ax in zip(images_arr, axes):
		ax.imshow(img)
		ax.axis('off')
	plt.tight_layout()
	plt.show()


def plotHistory(history):
	#print('history.history:', history.history)
	acc = history.history['mean_squared_error']
	val_acc = history.history['val_mean_squared_error']

	loss = history.history['loss']
	val_loss = history.history['val_loss']

	epochs_range = range(epochs)

	plt.figure(figsize=(8, 8))
	plt.subplot(1, 2, 1)
	plt.plot(epochs_range, acc, label='Training Accuracy')
	plt.plot(epochs_range, val_acc, label='Validation Accuracy')
	plt.legend(loc = 'lower right')
	plt.title('Training and Validation Accuracy')

	plt.subplot(1, 2, 2)
	plt.plot(epochs_range, loss, label='Training Loss')
	plt.plot(epochs_range, val_loss, label='Validation Loss')
	plt.legend(loc = 'upper right')
	plt.title('Training and Validation Loss')
	plt.show()


batch_size = 16
epochs = 15


trainingData, validationData = dataset.getDataFrames(lambda name: name[0] == 'f')

trainGen = dataset.makeDataGenerator(trainingData, batch_size = batch_size, shuffle = True)
validationGen = dataset.makeDataGenerator(validationData, batch_size = batch_size)


#sample_images, sample_labels = next(validationGen)
#print('labels:', sample_labels)
#plotImages(sample_images)


model.compile(optimizer = 'adam', loss = 'mean_squared_error', metrics = ['mse'])

#model.summary()


checkpoint_path = "./appraiser/training/cp-{epoch:04d}.ckpt"
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
plotHistory(history)
