
import os
from dotenv import load_dotenv


load_dotenv(dotenv_path = './.env.local')
load_dotenv()

import dataset
from plotUtils import plotImages



trainingData, validationData = dataset.getDataFrames(splitter = lambda name: name[0] == 'f')

#validationGen = dataset.makeDataGenerator(validationData, batch_size = 5, y_col = 'score')
validationGen = dataset.makeDataGenerator(validationData, batch_size = 5, y_col = os.environ.get('TRAINER_CLASS_COLS').split(','))

sample_images, sample_labels = next(validationGen)
print('labels:', sample_labels)
plotImages(sample_images)
