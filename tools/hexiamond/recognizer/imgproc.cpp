#include "imgproc.hpp"

#include <algorithm>
#include <cmath>

namespace hx {

namespace {

// cvRound / saturate_cast<int>: round half to even (the default FP rounding mode).
inline int roundEven (double value) { return int(std::nearbyint(value)); }
inline int roundEvenF (float value) { return int(std::nearbyintf(value)); }

inline uint8_t saturate8 (int value) { return uint8_t(value < 0 ? 0 : (value > 255 ? 255 : value)); }

inline int reflect101 (int index, int size) {
	if (size == 1)
		return 0;
	while (index < 0 || index >= size)
		index = index < 0 ? -index : 2 * size - 2 - index;
	return index;
}

struct AreaTab {
	int di;
	int si;
	float alpha;
};

// computeResizeAreaTab from OpenCV's resize.cpp.
std::vector<AreaTab> areaTab (int ssize, int dsize, double scale) {
	std::vector<AreaTab> tab;
	for (int dx = 0; dx < dsize; dx++) {
		double fsx1 = dx * scale;
		double fsx2 = fsx1 + scale;
		double cellWidth = std::min(scale, ssize - fsx1);
		int sx1 = int(std::ceil(fsx1)), sx2 = int(std::floor(fsx2));
		sx2 = std::min(sx2, ssize - 1);
		sx1 = std::min(sx1, sx2);
		if (sx1 - fsx1 > 1e-3)
			tab.push_back({dx, sx1 - 1, float((sx1 - fsx1) / cellWidth)});
		for (int sx = sx1; sx < sx2; sx++)
			tab.push_back({dx, sx, float(1.0 / cellWidth)});
		if (fsx2 - sx2 > 1e-3)
			tab.push_back({dx, sx2, float(std::min(std::min(fsx2 - sx2, 1.0), cellWidth) / cellWidth)});
	}
	return tab;
}

// getGaussianKernelBitExact + getGaussianKernelFixedPoint_ED(fractionBits = 8).
std::vector<int> fixedGaussianKernel (int n, double sigma) {
	double scale2X = -0.125 / (sigma * sigma);
	int half = (n - 1) / 2;
	std::vector<double> values(half);
	double sum = 0;
	for (int i = 0, x = 1 - n; i < half; i++, x += 2) {
		values[i] = std::exp(double(x * x) * scale2X);
		sum += values[i];
	}
	sum = sum * 2 + 1;
	double mul = 1 / sum;
	std::vector<int> kernel(n);
	double err = 0;
	int total = 0;
	for (int i = 0; i < half; i++) {
		double adjusted = values[i] * mul * 256 + err;
		int v = roundEven(adjusted);
		err = adjusted - v;
		kernel[i] = kernel[n - 1 - i] = v;
		total += v;
	}
	kernel[half] = 256 - total * 2;
	return kernel;
}

}

void resizeArea (const uint8_t* src, int width, int height, int channels, int dstW, int dstH, const int* channelIndex, int planes, Gray8* out) {
	for (int p = 0; p < planes; p++)
		out[p] = Gray8(dstW, dstH);
	// OpenCV derives the scale as 1 / (dst / src), which can differ from src / dst in the last bit.
	double scaleX = 1. / (double(dstW) / width), scaleY = 1. / (double(dstH) / height);
	int iscaleX = int(std::lround(scaleX)), iscaleY = int(std::lround(scaleY));
	if (std::fabs(scaleX - iscaleX) < 2.2204460492503131e-16 && std::fabs(scaleY - iscaleY) < 2.2204460492503131e-16) {
		// resizeAreaFast: integer box sums, times float(1 / area), rounded.
		int area = iscaleX * iscaleY;
		float inv = 1.f / float(area);
		for (int p = 0; p < planes; p++) {
			int c = channelIndex[p];
			for (int dy = 0; dy < dstH; dy++) {
				uint8_t* d = out[p].row(dy);
				for (int dx = 0; dx < dstW; dx++) {
					int sum = 0;
					for (int sy = dy * iscaleY; sy < (dy + 1) * iscaleY; sy++) {
						const uint8_t* s = src + (size_t(sy) * width + size_t(dx) * iscaleX) * channels + c;
						for (int k = 0; k < iscaleX; k++)
							sum += s[k * channels];
					}
					d[dx] = saturate8(roundEvenF(float(sum) * inv));
				}
			}
		}
		return;
	}
	std::vector<AreaTab> xtab = areaTab(width, dstW, scaleX), ytab = areaTab(height, dstH, scaleY);
	// Flatten the horizontal taps over the planes: per entry, source byte offset, destination slot and weight,
	// in xtab order so each destination still accumulates its contributions in OpenCV's order.
	struct Tap {
		uint32_t src;
		uint32_t dst;
		float alpha;
	};
	std::vector<Tap> taps;
	taps.reserve(xtab.size() * planes);
	for (const AreaTab& x : xtab)
		for (int p = 0; p < planes; p++)
			taps.push_back({uint32_t(x.si * channels + channelIndex[p]), uint32_t(x.di * planes + p), x.alpha});
	std::vector<float> buf(size_t(dstW) * planes), sum(size_t(dstW) * planes);
	size_t k = 0;
	for (int dy = 0; dy < dstH; dy++) {
		std::fill(sum.begin(), sum.end(), 0.f);
		for (; k < ytab.size() && ytab[k].di == dy; k++) {
			const uint8_t* s = src + size_t(ytab[k].si) * width * channels;
			float beta = ytab[k].alpha;
			std::fill(buf.begin(), buf.end(), 0.f);
			for (const Tap& t : taps)
				buf[t.dst] += s[t.src] * t.alpha;
			for (size_t i = 0; i < buf.size(); i++)
				sum[i] += beta * buf[i];
		}
		for (int p = 0; p < planes; p++) {
			uint8_t* d = out[p].row(dy);
			for (int dx = 0; dx < dstW; dx++)
				d[dx] = saturate8(roundEvenF(sum[size_t(dx) * planes + p]));
		}
	}
}

Gray8 gaussianBlur (const Gray8& src, int ksize, double sigma) {
	std::vector<int> kernel = fixedGaussianKernel(ksize, sigma);
	const int half = ksize / 2, w = src.width, h = src.height;
	// Horizontal pass into 8.8 fixed point (at most 255 * 256, fits 16 bits), vertical into 16.16 (fits 32 bits),
	// rounded back to 8 bits. The kernel is symmetric, so taps pair up: k[j] * (a + b). Integer sums are exact, so
	// the result is bit-identical to OpenCV whatever the summation order.
	std::vector<uint16_t> rows(size_t(w) * h);
	std::vector<uint8_t> padded(size_t(w) + 2 * half);
	for (int y = 0; y < h; y++) {
		const uint8_t* s = src.row(y);
		for (int x = -half; x < w + half; x++)
			padded[x + half] = s[reflect101(x, w)];
		const uint8_t* p = padded.data() + half;
		uint16_t* r = rows.data() + size_t(y) * w;
		for (int x = 0; x < w; x++) {
			uint32_t v = uint32_t(kernel[half]) * p[x];
			for (int j = 1; j <= half; j++)
				v += uint32_t(kernel[half - j]) * (uint32_t(p[x - j]) + p[x + j]);
			r[x] = uint16_t(v);
		}
	}
	Gray8 dst(w, h);
	std::vector<const uint16_t*> taps(ksize);
	for (int y = 0; y < h; y++) {
		for (int j = 0; j < ksize; j++)
			taps[j] = rows.data() + size_t(reflect101(y + j - half, h)) * w;
		uint8_t* d = dst.row(y);
		const uint16_t* center = taps[half];
		for (int x = 0; x < w; x++) {
			uint32_t v = uint32_t(kernel[half]) * center[x];
			for (int j = 1; j <= half; j++)
				v += uint32_t(kernel[half - j]) * (uint32_t(taps[half - j][x]) + taps[half + j][x]);
			d[x] = saturate8(int((v + (1u << 15)) >> 16));
		}
	}
	return dst;
}

Gray8 resizeLinearExact (const Gray8& src, double scale) {
	int dw = roundEven(src.width * scale), dh = roundEven(src.height * scale);
	double inv = 1.0 / scale;
	struct Coef {
		int offset;
		uint32_t c0, c1;
	};
	auto coefficients = [inv](int dsize, int ssize) {
		std::vector<Coef> result(dsize);
		for (int d = 0; d < dsize; d++) {
			double f = inv * (d + 0.5) - 0.5;
			int i = int(std::floor(f));
			if (i >= 0 && ssize > 1 && i < ssize - 1) {
				uint32_t c1 = uint32_t(std::min<int64_t>(65535, std::max<int64_t>(0, std::llrint((f - i) * 256))));
				result[d] = {i, 256 - c1, c1};
			}
			else
				result[d] = {i >= 0 && ssize > 1 ? ssize - 1 : 0, 256, 0};
		}
		return result;
	};
	std::vector<Coef> cx = coefficients(dw, src.width), cy = coefficients(dh, src.height);
	std::vector<uint32_t> rows(size_t(dw) * src.height);
	for (int y = 0; y < src.height; y++) {
		const uint8_t* s = src.row(y);
		uint32_t* r = rows.data() + size_t(y) * dw;
		for (int x = 0; x < dw; x++) {
			const Coef& c = cx[x];
			r[x] = s[c.offset] * c.c0 + (c.c1 ? s[c.offset + 1] * c.c1 : 0);
		}
	}
	Gray8 dst(dw, dh);
	for (int y = 0; y < dh; y++) {
		const Coef& c = cy[y];
		const uint32_t* r0 = rows.data() + size_t(c.offset) * dw;
		const uint32_t* r1 = c.c1 ? r0 + dw : r0;
		uint8_t* d = dst.row(y);
		for (int x = 0; x < dw; x++)
			d[x] = saturate8(int((uint64_t(r0[x]) * c.c0 + uint64_t(r1[x]) * c.c1 + (1u << 15)) >> 16));
	}
	return dst;
}

void bgrToHsv (int b, int g, int r, int& h, int& s, int& v) {
	static int sdiv[256], hdiv[256];
	static bool ready = false;
	const int shift = 12;
	if (!ready) {
		sdiv[0] = hdiv[0] = 0;
		for (int i = 1; i < 256; i++) {
			sdiv[i] = roundEven((255 << shift) / (1. * i));
			hdiv[i] = roundEven((180 << shift) / (6. * i));
		}
		ready = true;
	}
	v = std::max(b, std::max(g, r));
	int vmin = std::min(b, std::min(g, r));
	int diff = v - vmin;
	int vr = v == r ? -1 : 0, vg = v == g ? -1 : 0;
	s = (diff * sdiv[v] + (1 << (shift - 1))) >> shift;
	h = (vr & (g - b)) + (~vr & ((vg & (b - r + 2 * diff)) + ((~vg) & (r - g + 4 * diff))));
	h = (h * hdiv[diff] + (1 << (shift - 1))) >> shift;
	h += h < 0 ? 180 : 0;
}

float sampleBilinear (const float* image, int width, int height, float x, float y) {
	int X = roundEvenF(x * 32.f), Y = roundEvenF(y * 32.f);
	int ix = X >> 5, iy = Y >> 5;
	float a = float(X & 31) * (1.f / 32), b = float(Y & 31) * (1.f / 32);
	float w0 = (1.f - b) * (1.f - a), w1 = (1.f - b) * a, w2 = b * (1.f - a), w3 = b * a;
	int x0 = std::min(std::max(ix, 0), width - 1), x1 = std::min(std::max(ix + 1, 0), width - 1);
	int y0 = std::min(std::max(iy, 0), height - 1), y1 = std::min(std::max(iy + 1, 0), height - 1);
	const float* r0 = image + size_t(y0) * width;
	const float* r1 = image + size_t(y1) * width;
	return r0[x0] * w0 + r0[x1] * w1 + r1[x0] * w2 + r1[x1] * w3;
}

}
