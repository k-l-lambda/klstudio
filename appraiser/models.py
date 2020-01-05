
import os
import tensorflow.keras.models as models
import tensorflow.keras.layers as layers



imageDimension = int(os.environ.get('IMAGE_DIMENSION'))


model = models.Sequential([
	layers.Conv2D(4, 3, padding = 'same', activation = 'relu', input_shape = (imageDimension, imageDimension ,3)),
	layers.MaxPooling2D(),
	layers.Conv2D(8, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(16, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(32, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(64, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(128, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(256, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Conv2D(512, 3, padding = 'same', activation = 'relu'),
	layers.MaxPooling2D(),
	layers.Flatten(),
	layers.Dense(512, activation = 'relu'),
	layers.Dense(1, activation = 'linear'),
])
