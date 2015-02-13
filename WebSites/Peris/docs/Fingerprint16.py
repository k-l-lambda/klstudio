
from PIL import Image


SAMPLE_IMAGE_DIMENSION_MAX = 1024

PRINT_DIMENSION = 16


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
			grayscale = (min(color) + max(color)) / 2
			result.putpixel((x, y), grayscale)

	return result


def getHistogram(image):
	h = list(image.getdata())
	h.sort()

	return h


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
