
import os
from dotenv import load_dotenv
import pandas as pd
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt



load_dotenv(dotenv_path = './.env.local')
load_dotenv()


dataframe = pd.read_csv('./footages/labels.csv')
dataframe['filename'] = [hash + ".jpg" for hash in dataframe.hash]


train_image_generator = ImageDataGenerator(rescale = 1./255)
train_data_gen = train_image_generator.flow_from_dataframe(dataframe,
	directory = os.environ.get('DATASET_PATH'),
	x_col = 'filename',
	y_col = 'score',
	target_size = (1024, 1024),
	class_mode = 'other',
	)

sample_images, sample_labels = next(train_data_gen)


def plotImages(images_arr):
	fig, axes = plt.subplots(1, 5, figsize = (20, 20))
	axes = axes.flatten()
	for img, ax in zip(images_arr, axes):
		ax.imshow(img)
		ax.axis('off')
	plt.tight_layout()
	plt.show()


#print('labels:', sample_labels)
#plotImages(sample_images)
