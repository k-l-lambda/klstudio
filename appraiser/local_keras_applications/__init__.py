
import tensorflow.keras



def get_submodules_from_kwargs(kwargs):
	backend = tensorflow.keras.backend
	layers = tensorflow.keras.layers
	models = tensorflow.keras.models
	utils = tensorflow.keras.utils

	return backend, layers, models, utils



from . import xception
