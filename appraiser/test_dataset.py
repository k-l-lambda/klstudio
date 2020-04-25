
from dotenv import load_dotenv


load_dotenv(dotenv_path = './.env.local')
load_dotenv()

import dataset
from plotUtils import plotImages



trainingData, validationData = dataset.getDataFrames(splitter = lambda name: name[0] == 'f')

#trainGen = dataset.makeDataGenerator(trainingData, batch_size = 16, shuffle = True)
validationGen = dataset.makeDataGenerator(validationData, batch_size = 5, y_col = ['SE', 'SM', 'NF', 'ANI', 'LOLI', 'DOLL'])

sample_images, sample_labels = next(validationGen)
print('labels:', sample_labels)
plotImages(sample_images)
