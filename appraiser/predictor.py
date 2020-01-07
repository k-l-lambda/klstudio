
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import tensorflow as tf

load_dotenv(dotenv_path = './.env.local')
load_dotenv()

import dataset



model = tf.keras.models.load_model('./appraiser/training/cp-0015.h5')


trainingData, validationData = dataset.getDataFrames(lambda name: name[0] == 'f')

#trainGen = dataset.makeDataGenerator(trainingData, batch_size = batch_size, shuffle = True)
validationGen = dataset.makeDataGenerator(validationData, batch_size = 16)


sample_images, sample_labels = next(validationGen)


def plotImages(images_arr):
	result = model.predict(images_arr)
	print('result:', result)

	_, axes = plt.subplots(1, 5, figsize = (20, 20))
	axes = axes.flatten()
	for img, ax in zip(images_arr, axes):
		ax.imshow(img)
		ax.axis('off')
	plt.tight_layout()
	plt.show()


plotImages(sample_images[:5])
