
from local_keras_applications.xception import Xception



#import tensorflow.keras
#print('tensorflow.keras.backend:', tensorflow.keras.backend)

#print('Xception:', Xception)
model = Xception(input_shape = (1024, 1024, 3), weights = None, classes = 10)
model.compile(optimizer = 'adam', loss = 'categorical_crossentropy', metrics = ['accuracy'])

model.summary()
