
from PIL import Image


SAMPLE_IMAGE_DIMENSION_MAX = 1024

PRINT_DIMENSION = 4


def crop(image):
	width, height = image.size

	result = None
	dimension = min(width, height)

	if width > height:
		result = image.crop(((width - dimension) / 2, 0, (width + dimension) / 2, dimension))
	else:
		result = image.crop((0, (height - dimension) / 2, dimension, (height + dimension) / 2))

	if dimension > SAMPLE_IMAGE_DIMENSION_MAX:
		result = result.resize((SAMPLE_IMAGE_DIMENSION_MAX, SAMPLE_IMAGE_DIMENSION_MAX), Image.BICUBIC)

	return result


def desaturate(image):
	result = Image.new('L', image.size)

	for x in range(0, image.size[0]):
		for y in range(0, image.size[1]):
			color = image.getpixel((x, y))
			grayscale = color
			if type(color) == tuple:
				grayscale = (min(color) + max(color)) / 2
			result.putpixel((x, y), grayscale)

	return result


def getHistogram(image):
	h = list(image.getdata())
	h.sort()

	return h


def lookupHistogram(color, histogram):
	if not histogram or color < histogram[0]:
		return 0

	c = color
	while not c in histogram:
		c -= 1

	return float(histogram.index(c)) / len(histogram)


def genThumbnail(image, dimensions):
	result = Image.new('L', dimensions)

	for x in range(0, dimensions[0]):
		for y in range(0, dimensions[1]):
			fx = float(x)
			fy = float(y)
			subimage = image.crop((int(image.size[0] * (fx / dimensions[0])), int(image.size[1] * (fy / dimensions[1])), int(image.size[0] * ((fx + 1) / dimensions[0])), int(image.size[1] * ((fy + 1) / dimensions[1]))))
			pixels = list(subimage.getdata())
			grayscale = int(sum(pixels) / len(pixels))
			result.putpixel((x, y), grayscale)

	return result


def fileFingerprint(file):
	source = Image.open(file)
	sample = desaturate(crop(source))

	histogram = getHistogram(sample)

	thumb = genThumbnail(sample, (PRINT_DIMENSION, PRINT_DIMENSION))

	scales = []
	for p in [(x,y) for y in range(0, thumb.size[1]) for x in range(0, thumb.size[0])]:
		color = thumb.getpixel(p)
		scale = int(lookupHistogram(color, histogram) * 16)
		scales.append(scale)

	return ('%x' * len(scales)) % tuple(scales)


def fileThumbnailCode(file):
	source = Image.open(file)
	sample = desaturate(crop(source))

	thumb = genThumbnail(sample, (PRINT_DIMENSION, PRINT_DIMENSION))
	data = [x / 16 for x in list(thumb.getdata())]

	return ('%x' * len(data)) % tuple(data)


def rawDifferFingerprints(print1, print2):
	a1 = [int(x, 16) for x in print1]
	a2 = [int(x, 16) for x in print2]

	differ = 0
	for i in range(0, len(a1)):
		differ += abs(a1[i] - a2[i])

	return differ


def mirrorFingerprint(fp, segment = 4):
	return ''.join([fp[i:i + segment][::-1] for i in range(0, len(fp), segment)])


def differFingerprints(print1, print2):
	return min(rawDifferFingerprints(print1, print2), rawDifferFingerprints(mirrorFingerprint(print1), print2))


def differFiles(file1, file2):
	return differFingerprints(fileFingerprint(file1), fileFingerprint(file2))
