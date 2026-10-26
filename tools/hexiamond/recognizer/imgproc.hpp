// Minimal image operations the recognizer needs, reproducing OpenCV's 8-bit results without linking it:
// INTER_AREA downscale, bit-exact GaussianBlur and INTER_LINEAR_EXACT resize, BGR->HSV, remap-style bilinear sampling.
#pragma once

#include <cstddef>
#include <cstdint>
#include <vector>

namespace hx {

struct Gray8 {
	int width = 0;
	int height = 0;
	std::vector<uint8_t> data;

	Gray8 () = default;
	Gray8 (int w, int h) : width(w), height(h), data(size_t(w) * size_t(h)) {}
	const uint8_t* row (int y) const { return data.data() + size_t(y) * size_t(width); }
	uint8_t* row (int y) { return data.data() + size_t(y) * size_t(width); }
};

// cv::resize(INTER_AREA) of an interleaved 8-bit image to (dstW, dstH), one output plane per requested channel.
void resizeArea (const uint8_t* src, int width, int height, int channels, int dstW, int dstH, const int* channelIndex, int planes, Gray8* out);

// cv::GaussianBlur on CV_8U: fixed-point kernel (8 fraction bits, error-diffused), BORDER_REFLECT_101.
Gray8 gaussianBlur (const Gray8& src, int ksize, double sigma);

// cv::resize(fx = fy = scale, INTER_LINEAR_EXACT) on CV_8U.
Gray8 resizeLinearExact (const Gray8& src, double scale);

// cv::cvtColor(BGR2HSV) for one 8-bit pixel: H in [0, 180), S and V in [0, 255].
void bgrToHsv (int b, int g, int r, int& h, int& s, int& v);

// cv::remap(INTER_LINEAR, BORDER_REPLICATE) at one float position: coordinates quantized to 1/32 px, float weights.
float sampleBilinear (const float* image, int width, int height, float x, float y);

}
