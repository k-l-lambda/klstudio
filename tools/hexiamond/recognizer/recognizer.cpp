// Port of app/hexiamond/photo-recognition.ipynb §1–§11. Section numbers in comments refer to the notebook.
// Where the notebook computes in float32 (NumPy arrays from LSD output), the port does too, so bins and
// windows fall the same way; everything after the segments is double, as in NumPy.
#include "recognizer.hpp"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstring>
#include <limits>
#include <numeric>
#include <unordered_set>

#include "imgproc.hpp"
#include "lsd.hpp"
#include "optimize.hpp"

namespace hx {

namespace {

const int LONG_SIDE = 1024;
const double MIN_LENGTH = 0.03;
const double BLUR = 1.0;
const float STRENGTH_OFFSET = 2.0f;
const double MOD_SHIFT = 30;
const double PEAK_HALF_WIDTH = 2.0;
const double PEAK_STEP = 0.1;
const double FIT_CLIPS[] = {24, 16, 10, 6};
const double PRIOR_FILL = 0.7;
const double PRIOR_SCALE_STD = 0.2;
const double PRIOR_CENTER_STD = 0.2;
const double OUTSIDE_WEIGHT = 20.0;
const double OUTSIDE_MARGIN = 0.3;
const int COARSE_STEPS = 80;
const double COARSE_RATE = 0.15;
const double COARSE_MAX_STEP = 0.5;
const double MAX_KEYSTONE = 1.3;
const double EDGE_ANGLE_TOLERANCE = 3.0;
const double EDGE_OFFSET_TOLERANCE = 0.16;
const int EDGE_SAMPLES = 64;
const double EDGE_THRESHOLDS_DESC[] = {0.7, 0.5, 0.3, 0.1};
const int PIECE_CELLS = 6;

const double PI = 3.141592653589793;
const double LATTICE_HEIGHT = std::sqrt(3.0) / 2;
const float PIF = 3.141592653589793238462643383279502884f;

struct P {
	double x, y;
};

inline P operator- (P a, P b) { return {a.x - b.x, a.y - b.y}; }
inline P operator+ (P a, P b) { return {a.x + b.x, a.y + b.y}; }
inline P operator* (double s, P a) { return {s * a.x, s * a.y}; }
inline double dot (P a, P b) { return a.x * b.x + a.y * b.y; }
inline double cross (P a, P b) { return a.x * b.y - a.y * b.x; }
inline double norm (P a) { return std::sqrt(a.x * a.x + a.y * a.y); }

// numpy.remainder / Python %.
inline float remF (float a, float b) {
	float m = std::fmod(a, b);
	if (m != 0) {
		if ((b < 0) != (m < 0))
			m += b;
	}
	else
		m = std::copysign(0.f, b);
	return m;
}

inline double rem (double a, double b) {
	double m = std::fmod(a, b);
	if (m != 0) {
		if ((b < 0) != (m < 0))
			m += b;
	}
	else
		m = std::copysign(0.0, b);
	return m;
}

inline P unit (double deg) { return {std::cos(deg * (PI / 180.0)), std::sin(deg * (PI / 180.0))}; }

// np.linspace(start, stop, num)[i]
inline double linspace (double start, double stop, int num, int i) {
	if (i == num - 1)
		return stop;
	return i * ((stop - start) / (num - 1)) + start;
}

// np.percentile(values, q), linear interpolation.
double percentile (std::vector<double> values, double q) {
	std::sort(values.begin(), values.end());
	double pos = q / 100 * (values.size() - 1);
	size_t lo = size_t(std::floor(pos)), hi = std::min(lo + 1, values.size() - 1);
	double frac = pos - lo;
	return values[lo] + (values[hi] - values[lo]) * frac;
}

double median (std::vector<double> values) { return percentile(std::move(values), 50); }

P toImage (const double* H, P p) {
	double w = H[6] * p.x + H[7] * p.y + H[8];
	return {(H[0] * p.x + H[1] * p.y + H[2]) / w, (H[3] * p.x + H[4] * p.y + H[5]) / w};
}

void invert3 (const double* m, double* inv) {
	double a = m[4] * m[8] - m[5] * m[7], b = m[5] * m[6] - m[3] * m[8], c = m[3] * m[7] - m[4] * m[6];
	double det = m[0] * a + m[1] * b + m[2] * c;
	inv[0] = a / det;
	inv[1] = (m[2] * m[7] - m[1] * m[8]) / det;
	inv[2] = (m[1] * m[5] - m[2] * m[4]) / det;
	inv[3] = b / det;
	inv[4] = (m[0] * m[8] - m[2] * m[6]) / det;
	inv[5] = (m[2] * m[3] - m[0] * m[5]) / det;
	inv[6] = c / det;
	inv[7] = (m[1] * m[6] - m[0] * m[7]) / det;
	inv[8] = (m[0] * m[4] - m[1] * m[3]) / det;
}

struct Board {
	std::vector<std::array<P, 3>> triangles;
	std::vector<P> vertices;                   // triangles flattened, 3 per cell (duplicates kept, as the notebook)
	std::vector<std::pair<P, P>> internal;     // internal edges, notebook order
	std::vector<std::pair<int, int>> pairs;    // the two cells of each internal edge
	std::vector<P> hull;
	P centroid;
};

Board buildBoard (const std::vector<std::vector<int>>& rows) {
	Board board;
	// Lattice vertex (a - b/2, b·√3/2) keyed exactly by the integer pair (2a - b, b).
	struct Key {
		int u, v;
		bool operator< (const Key& o) const { return u != o.u ? u < o.u : v < o.v; }
		bool operator== (const Key& o) const { return u == o.u && v == o.v; }
	};
	struct Edge {
		Key a, b;
		std::vector<int> cells;
	};
	std::vector<Edge> edges;
	auto vertex = [](int a, int b) { return P{a - b / 2.0, b * LATTICE_HEIGHT}; };
	auto key = [](int a, int b) { return Key{2 * a - b, b}; };
	for (int y = 0; y < int(rows.size()); y++) {
		for (int packed = 0; packed < int(rows[y].size()); packed++) {
			if (rows[y][packed] <= 0)
				continue;
			int x = packed / 2, parity = packed % 2;
			int ab[3][2] = {{x, y}, {x + parity, y + 1 - parity}, {x + 1, y + 1}};
			int cell = int(board.triangles.size());
			std::array<P, 3> triangle;
			for (int i = 0; i < 3; i++) {
				triangle[i] = vertex(ab[i][0], ab[i][1]);
				board.vertices.push_back(triangle[i]);
			}
			board.triangles.push_back(triangle);
			for (int i = 0; i < 3; i++) {
				Key k0 = key(ab[i][0], ab[i][1]), k1 = key(ab[(i + 1) % 3][0], ab[(i + 1) % 3][1]);
				if (k1 < k0)
					std::swap(k0, k1);
				auto found = std::find_if(edges.begin(), edges.end(), [&](const Edge& e) { return e.a == k0 && e.b == k1; });
				if (found == edges.end())
					edges.push_back({k0, k1, {cell}});
				else
					found->cells.push_back(cell);
			}
		}
	}
	auto point = [](Key k) { return P{k.u / 2.0, k.v * LATTICE_HEIGHT}; };
	for (const Edge& e : edges) {
		if (e.cells.size() == 2) {
			board.internal.push_back({point(e.a), point(e.b)});
			board.pairs.push_back({e.cells[0], e.cells[1]});
		}
	}
	double sx = 0, sy = 0;
	for (P v : board.vertices) {
		sx += v.x;
		sy += v.y;
	}
	board.centroid = {sx / board.vertices.size(), sy / board.vertices.size()};
	// Convex hull on the exact lattice keys (integer cross products), so collinear outline vertices drop out and the
	// hull is the board's true outline. The notebook uses cv2.convexHull on float32 vertices, which keeps the nearly
	// collinear ones: the margin offset then intersects almost parallel edges, an ill-conditioned solve whose result
	// moved with compiler rounding (gcc -O3 produced a degenerate margin polygon from it).
	std::vector<Key> keys;
	for (const Edge& e : edges) {
		keys.push_back(e.a);
		keys.push_back(e.b);
	}
	std::sort(keys.begin(), keys.end());
	keys.erase(std::unique(keys.begin(), keys.end()), keys.end());
	auto turn = [](Key o, Key a, Key b) { return int64_t(a.u - o.u) * (b.v - o.v) - int64_t(a.v - o.v) * (b.u - o.u); };
	std::vector<Key> chain(2 * keys.size());
	size_t k = 0;
	for (size_t i = 0; i < keys.size(); i++) {
		while (k >= 2 && turn(chain[k - 2], chain[k - 1], keys[i]) <= 0)
			k--;
		chain[k++] = keys[i];
	}
	for (size_t i = keys.size() - 1, t = k + 1; i > 0; i--) {
		while (k >= t && turn(chain[k - 2], chain[k - 1], keys[i - 1]) <= 0)
			k--;
		chain[k++] = keys[i - 1];
	}
	std::vector<P> hull;
	for (size_t i = 0; i + 1 < k; i++)
		hull.push_back(point(chain[i]));
	board.hull = hull;
	return board;
}

std::vector<P> offsetPolygon (const std::vector<P>& polygon, double margin) {
	double orientation = cross(polygon[1] - polygon[0], polygon[2] - polygon[0]) > 0 ? 1 : -1;
	size_t n = polygon.size();
	std::vector<std::pair<P, double>> lines;
	for (size_t i = 0; i < n; i++) {
		P p0 = polygon[i], p1 = polygon[(i + 1) % n];
		P e = (1 / norm(p1 - p0)) * (p1 - p0);
		P outward = orientation * P{e.y, -e.x};
		lines.push_back({outward, dot(outward, p0) + margin});
	}
	std::vector<P> result;
	for (size_t i = 0; i < n; i++) {
		const auto& l0 = lines[(i + n - 1) % n];
		const auto& l1 = lines[i];
		double det = l0.first.x * l1.first.y - l0.first.y * l1.first.x;
		result.push_back({(l0.second * l1.first.y - l0.first.y * l1.second) / det, (l0.first.x * l1.second - l0.second * l1.first.x) / det});
	}
	return result;
}

// Union-find labels as np.unique(roots, return_inverse=True).
std::vector<int> regionLabels (int cells, const std::vector<std::pair<int, int>>& pairs, const std::vector<uint8_t>& cut) {
	std::vector<int> parent(cells);
	std::iota(parent.begin(), parent.end(), 0);
	auto find = [&](int i) {
		while (parent[i] != i) {
			parent[i] = parent[parent[i]];
			i = parent[i];
		}
		return i;
	};
	for (size_t e = 0; e < pairs.size(); e++)
		if (!cut[e])
			parent[find(pairs[e].first)] = find(pairs[e].second);
	std::vector<int> roots(cells);
	for (int i = 0; i < cells; i++)
		roots[i] = find(i);
	std::vector<int> unique = roots;
	std::sort(unique.begin(), unique.end());
	unique.erase(std::unique(unique.begin(), unique.end()), unique.end());
	std::vector<int> labels(cells);
	for (int i = 0; i < cells; i++)
		labels[i] = int(std::lower_bound(unique.begin(), unique.end(), roots[i]) - unique.begin());
	return labels;
}

std::vector<int> bincount (const std::vector<int>& labels) {
	std::vector<int> counts(labels.empty() ? 0 : *std::max_element(labels.begin(), labels.end()) + 1, 0);
	for (int l : labels)
		counts[l]++;
	return counts;
}

// Pixels of a polygon union in the source photo, eroded by a (2r+1)² square as cv2.erode (outside the photo counts as set).
struct Mask {
	int x0 = 0, y0 = 0, w = 0, h = 0;
	std::vector<uint8_t> m;
};

Mask rasterize (const std::vector<std::array<P, 3>>& triangles, int r, int imageW, int imageH) {
	Mask mask;
	double minX = 1e300, minY = 1e300, maxX = -1e300, maxY = -1e300;
	for (const auto& t : triangles)
		for (P p : t) {
			minX = std::min(minX, p.x);
			maxX = std::max(maxX, p.x);
			minY = std::min(minY, p.y);
			maxY = std::max(maxY, p.y);
		}
	int x0 = std::max(0, int(std::floor(minX)) - r - 1), x1 = std::min(imageW - 1, int(std::ceil(maxX)) + r + 1);
	int y0 = std::max(0, int(std::floor(minY)) - r - 1), y1 = std::min(imageH - 1, int(std::ceil(maxY)) + r + 1);
	if (x1 < x0 || y1 < y0)
		return mask;
	mask.x0 = x0;
	mask.y0 = y0;
	mask.w = x1 - x0 + 1;
	mask.h = y1 - y0 + 1;
	mask.m.assign(size_t(mask.w) * mask.h, 0);
	// Scanline fill per triangle, like cv2.fillPoly on vertices rounded to 1/16 px: pixel (x, y) is the point (x, y),
	// a row spans round(left)..round(right) inclusive.
	for (const auto& t : triangles) {
		P v[3];
		for (int i = 0; i < 3; i++)
			v[i] = {std::nearbyint(t[i].x * 16) / 16, std::nearbyint(t[i].y * 16) / 16};
		double tMinY = std::min(v[0].y, std::min(v[1].y, v[2].y)), tMaxY = std::max(v[0].y, std::max(v[1].y, v[2].y));
		for (int y = std::max(y0, int(std::ceil(tMinY))); y <= std::min(y1, int(std::floor(tMaxY))); y++) {
			double left = 1e300, right = -1e300;
			for (int i = 0; i < 3; i++) {
				P a = v[i], b = v[(i + 1) % 3];
				if ((a.y <= y && b.y >= y) || (b.y <= y && a.y >= y)) {
					if (a.y == b.y) {
						left = std::min(left, std::min(a.x, b.x));
						right = std::max(right, std::max(a.x, b.x));
					}
					else {
						double x = a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);
						left = std::min(left, x);
						right = std::max(right, x);
					}
				}
			}
			int xl = std::max(x0, int(std::nearbyint(left))), xr = std::min(x1, int(std::nearbyint(right)));
			uint8_t* row = mask.m.data() + size_t(y - y0) * mask.w;
			for (int x = xl; x <= xr; x++)
				row[x - x0] = 1;
		}
	}
	if (r <= 0)
		return mask;
	// Separable square erosion via run lengths; a run reaching the photo border continues past it.
	// Both passes walk rows, so the full-resolution masks stay cache-friendly.
	// Run lengths only need comparing against r, so they saturate at r + 1 and fit 16 bits.
	const uint16_t far = uint16_t(std::min(r + 1, 65535));
	auto grow = [far](uint16_t run) { return run < far ? uint16_t(run + 1) : far; };
	std::vector<uint16_t> left(mask.w), right(mask.w);
	for (int y = 0; y < mask.h; y++) {
		uint8_t* line = mask.m.data() + size_t(y) * mask.w;
		for (int x = 0; x < mask.w; x++)
			left[x] = line[x] ? (x == 0 ? (x0 == 0 ? far : 1) : grow(left[x - 1])) : 0;
		for (int x = mask.w - 1; x >= 0; x--)
			right[x] = line[x] ? (x == mask.w - 1 ? (x1 == imageW - 1 ? far : 1) : grow(right[x + 1])) : 0;
		for (int x = 0; x < mask.w; x++)
			line[x] = left[x] > r && right[x] > r ? 1 : 0;
	}
	std::vector<uint16_t> down(size_t(mask.w) * mask.h), up(mask.w);
	for (int y = mask.h - 1; y >= 0; y--) {
		const uint8_t* line = mask.m.data() + size_t(y) * mask.w;
		uint16_t* d = down.data() + size_t(y) * mask.w;
		for (int x = 0; x < mask.w; x++)
			d[x] = line[x] ? (y == mask.h - 1 ? (y1 == imageH - 1 ? far : 1) : grow(d[x + mask.w])) : 0;
	}
	for (int y = 0; y < mask.h; y++) {
		uint8_t* line = mask.m.data() + size_t(y) * mask.w;
		const uint16_t* d = down.data() + size_t(y) * mask.w;
		for (int x = 0; x < mask.w; x++) {
			up[x] = line[x] ? (y == 0 ? (y0 == 0 ? far : 1) : grow(up[x])) : 0;
			line[x] = up[x] > r && d[x] > r ? 1 : 0;
		}
	}
	return mask;
}

// Colour statistics of the masked pixels, accumulated without storing them: saturation-weighted hue vector,
// value sum, and saturation / value histograms (for the median and the 64-bin mode).
struct ColourStats {
	double sumSin = 0, sumCos = 0, sumValue = 0;
	size_t count = 0;
	uint32_t saturation[256] = {0};
	uint32_t value[256] = {0};

	double hue () const { return rem(std::atan2(sumSin, sumCos) * (180 / PI), 360); }
	double meanValue () const { return sumValue / count; }
	// np.median of the saturations.
	double medianSaturation () const {
		size_t lo = (count - 1) / 2, hi = count / 2, seen = 0;
		double a = -1, b = -1;
		for (int s = 0; s < 256; s++) {
			if (a < 0 && seen + saturation[s] > lo)
				a = s;
			if (b < 0 && seen + saturation[s] > hi)
				b = s;
			seen += saturation[s];
		}
		return (a + b) / 2;
	}
	// Centre of the most populated bin of np.histogram(value, bins=64, range=(0, 256)).
	double valueMode () const {
		uint32_t counts[64] = {0};
		for (int v = 0; v < 256; v++)
			counts[v / 4] += value[v];
		return int(std::max_element(counts, counts + 64) - counts) * 4 + 2;
	}
};

ColourStats maskStats (const Mask& mask, const RecognizeInput& input) {
	static double sinTable[180], cosTable[180];
	static bool ready = false;
	if (!ready) {
		for (int h = 0; h < 180; h++) {
			sinTable[h] = std::sin(h * 2 * (PI / 180));
			cosTable[h] = std::cos(h * 2 * (PI / 180));
		}
		ready = true;
	}
	ColourStats stats;
	int bi = input.bgr ? 0 : 2, ri = input.bgr ? 2 : 0;
	for (int y = 0; y < mask.h; y++) {
		const uint8_t* row = mask.m.data() + size_t(y) * mask.w;
		const uint8_t* src = input.pixels + (size_t(mask.y0 + y) * input.width + mask.x0) * input.channels;
		for (int x = 0; x < mask.w; x++) {
			if (!row[x])
				continue;
			const uint8_t* px = src + size_t(x) * input.channels;
			int h, s, v;
			bgrToHsv(px[bi], px[1], px[ri], h, s, v);
			double weight = s + 1e-6;
			stats.sumSin += weight * sinTable[h];
			stats.sumCos += weight * cosTable[h];
			stats.sumValue += v;
			stats.saturation[s]++;
			stats.value[v]++;
			stats.count++;
		}
	}
	return stats;
}

struct Bits {
	uint64_t w[2] = {0, 0};
	void set (int i) { w[i >> 6] |= uint64_t(1) << (i & 63); }
	bool has (int i) const { return (w[i >> 6] >> (i & 63)) & 1; }
	int count () const { return __builtin_popcountll(w[0]) + __builtin_popcountll(w[1]); }
	bool operator== (const Bits& o) const { return w[0] == o.w[0] && w[1] == o.w[1]; }
};

struct BitsHash {
	size_t operator() (const Bits& b) const { return size_t(b.w[0] * 0x9E3779B97F4A7C15ull ^ (b.w[1] + 0x632BE59BD9B4E019ull)); }
};

}

RecognizeResult recognize (const RecognizeInput& input) {
	RecognizeResult result;
	double clock = hx_now();
	auto lap = [&](const char* name) {
		double now = hx_now();
		result.timing.push_back({name, now - clock});
		clock = now;
	};
	if (!input.pixels || input.width < 8 || input.height < 8 || (input.channels != 3 && input.channels != 4)) {
		result.error = "bad image";
		return result;
	}
	Board board = buildBoard(input.board);
	const int cells = int(board.triangles.size());
	if (cells == 0 || cells > 128 || board.hull.size() < 3) {
		result.error = "bad board";
		return result;
	}

	// §1 normalize
	const double scale = double(LONG_SIDE) / std::max(input.width, input.height);
	const int nw = int(std::nearbyint(input.width * scale)), nh = int(std::nearbyint(input.height * scale));
	result.scale = scale;
	result.normalizedWidth = nw;
	result.normalizedHeight = nh;
	const int channelIndex[3] = {input.bgr ? 0 : 2, 1, input.bgr ? 2 : 0};  // B, G, R as the notebook
	Gray8 planes[3];
	resizeArea(input.pixels, input.width, input.height, input.channels, nw, nh, channelIndex, 3, planes);
	lap("normalize");

	// §2 per-channel segments, length filter, strength
	struct Seg {
		float x1, y1, x2, y2, length, strength;
	};
	std::vector<Seg> segs;
	const double minLength = MIN_LENGTH * LONG_SIDE;
	std::vector<float> channel(size_t(nw) * nh);
	for (int c = 0; c < 3; c++) {
		std::vector<Segment> lines = detectLineSegments(gaussianBlur(planes[c], 7, BLUR));
		for (size_t i = 0; i < channel.size(); i++)
			channel[i] = planes[c].data[i];
		for (const Segment& s : lines) {
			float dx = s.x2 - s.x1, dy = s.y2 - s.y1;
			float length = std::hypot(dx, dy);
			if (!(length >= float(minLength)))  // NumPy compares float32 lengths against the scalar cast to float32
				continue;
			int steps = std::max(int(length), 2);
			float nx = -dy / length * STRENGTH_OFFSET, ny = dx / length * STRENGTH_OFFSET;
			double total = 0;
			for (int i = 0; i < steps; i++) {
				float t = i == steps - 1 ? 1.f : float(i * (1.0 / (steps - 1)));
				float xs = s.x1 + dx * t, ys = s.y1 + dy * t;
				float a = sampleBilinear(channel.data(), nw, nh, xs + nx, ys + ny);
				float b = sampleBilinear(channel.data(), nw, nh, xs - nx, ys - ny);
				total += std::fabs(a - b);
			}
			float mean = float(total / steps);
			segs.push_back({s.x1, s.y1, s.x2, s.y2, length, float(mean / 255.0)});
		}
	}
	result.segmentCount = int(segs.size());
	lap("segments");
	if (segs.size() < 3) {
		result.error = "too few segments";
		return result;
	}

	// §3 folded angle peak
	const size_t n = segs.size();
	std::vector<float> angles(n), folded(n), weights(n);
	for (size_t i = 0; i < n; i++) {
		const Seg& s = segs[i];
		angles[i] = remF(std::atan2(s.y2 - s.y1, s.x2 - s.x1) * (180.0f / PIF), 180.f);
		folded[i] = remF(angles[i] + float(MOD_SHIFT), 60.f);
		weights[i] = s.length * s.strength;
	}
	{
		double re = 0, im = 0, wsum = 0;
		for (size_t i = 0; i < n; i++) {
			double phase = double(folded[i] * 6.f * (PIF / 180.0f));
			re += weights[i] * std::cos(phase);
			im += weights[i] * std::sin(phase);
			wsum += weights[i];
		}
		result.peak = rem(std::atan2(im, re) * (180 / PI) / 6, 60);
	}
	const double center = std::nearbyint(result.peak * 10) / 10;
	std::vector<uint8_t> window(n);
	double axes[3];
	for (int k = 0; k < 3; k++)
		axes[k] = rem(center - MOD_SHIFT + k * 60, 180);
	std::vector<int> direction(n);
	for (size_t i = 0; i < n; i++) {
		window[i] = std::fabs(remF(folded[i] - float(center) + 30.f, 60.f) - 30.f) <= float(PEAK_HALF_WIDTH);
		direction[i] = int(remF(std::nearbyint((angles[i] - float(axes[0])) / 60.f), 3.f));
	}

	// §4 per-direction modes at 0.1°
	const int binCount = int(std::nearbyint(2 * PEAK_HALF_WIDTH / PEAK_STEP));
	for (int k = 0; k < 3; k++) {
		std::vector<double> edges(binCount + 1), counts(binCount, 0);
		for (int b = 0; b <= binCount; b++)
			edges[b] = axes[k] - PEAK_HALF_WIDTH + PEAK_STEP * b;
		for (size_t i = 0; i < n; i++) {
			if (!window[i] || direction[i] != k)
				continue;
			float unwrapped = float(axes[k]) + remF(angles[i] - float(axes[k]) + 90.f, 180.f) - 90.f;
			double v = unwrapped;
			if (v < edges[0] || v > edges[binCount])
				continue;
			int b = int(std::upper_bound(edges.begin(), edges.end(), v) - edges.begin()) - 1;
			if (b == binCount)
				b--;
			counts[b] += weights[i];
		}
		int best = int(std::max_element(counts.begin(), counts.end()) - counts.begin());
		result.modes[k] = edges[best] + PEAK_STEP / 2;
	}
	for (size_t i = 0; i < n; i++)
		result.windowCount += window[i];
	lap("angles");

	// §6.1 linear part from the modes
	double L[4];
	{
		P e0 = unit(result.modes[0]), e1 = unit(result.modes[1]), e2 = unit(result.modes[2]);
		// Solve [e1, -e2] (l1, l2) = e0.
		double det = e1.x * (-e2.y) - (-e2.x) * e1.y;
		double l1 = (e0.x * (-e2.y) - (-e2.x) * e0.y) / det;
		P u0 = unit(0), u1 = unit(60);
		double bdet = u0.x * u1.y - u1.x * u0.y;
		double binv[4] = {u1.y / bdet, -u1.x / bdet, -u0.y / bdet, u0.x / bdet};
		double A[4] = {e0.x, l1 * e1.x, e0.y, l1 * e1.y};
		L[0] = A[0] * binv[0] + A[1] * binv[2];
		L[1] = A[0] * binv[1] + A[1] * binv[3];
		L[2] = A[2] * binv[0] + A[3] * binv[2];
		L[3] = A[2] * binv[1] + A[3] * binv[3];
		double d = L[0] * L[3] - L[1] * L[2];
		if (!(d > 0)) {
			result.error = "directions imply a mirrored board";
			return result;
		}
		if (L[0] < 0)
			for (double& v : L)
				v = -v;
		double s = std::sqrt(d);
		for (double& v : L)
			v /= s;
	}
	auto applyL = [&L](P p) { return P{L[0] * p.x + L[1] * p.y, L[2] * p.x + L[3] * p.y}; };

	// §6.2 coarse pose (prior + outside segments), fine lattice fit, one-cell neighbour walk
	std::vector<size_t> fit;
	for (size_t i = 0; i < n; i++)
		if (window[i])
			fit.push_back(i);
	const size_t m = fit.size();
	std::vector<P> fitMids(m), fitStart(m), fitDelta(m);
	std::vector<int> fitDirs(m);
	std::vector<double> fitW(m), fitStrength(m), fitLengths(m);
	double fitWSum = 0, fitStrengthLength = 0;
	for (size_t j = 0; j < m; j++) {
		const Seg& s = segs[fit[j]];
		fitMids[j] = {double((s.x1 + s.x2) / 2.f), double((s.y1 + s.y2) / 2.f)};
		fitStart[j] = {s.x1, s.y1};
		fitDelta[j] = {double(s.x2) - s.x1, double(s.y2) - s.y1};
		fitDirs[j] = direction[fit[j]];
		fitW[j] = weights[fit[j]];
		fitStrength[j] = s.strength;
		fitLengths[j] = s.length;
		fitWSum += fitW[j];
		fitStrengthLength += fitStrength[j] * fitLengths[j];
	}
	P boardNormals[3] = {unit(90), unit(150), unit(210)};

	auto clippedLoss = [&](const double* H, const std::vector<P>& points, const std::vector<int>& dirs, const std::vector<double>& w, double wsum, double clip, double pxPerUnit) {
		double inv[9];
		invert3(H, inv);
		double total = 0, clip2 = clip * clip;
		for (size_t i = 0; i < points.size(); i++) {
			P q = toImage(inv, points[i]);
			double offset = dot(q, boardNormals[dirs[i]]) / LATTICE_HEIGHT;
			double r = (offset - std::nearbyint(offset)) * LATTICE_HEIGHT * pxPerUnit;
			total += w[i] * std::min(r * r, clip2);
		}
		return total / wsum;
	};
	auto inlierShare = [&](const double* H, const std::vector<P>& points, const std::vector<int>& dirs, const std::vector<double>& w, double wsum, double pxPerUnit) {
		double inv[9];
		invert3(H, inv);
		double in = 0;
		for (size_t i = 0; i < points.size(); i++) {
			P q = toImage(inv, points[i]);
			double offset = dot(q, boardNormals[dirs[i]]) / LATTICE_HEIGHT;
			if (std::fabs((offset - std::nearbyint(offset)) * LATTICE_HEIGHT * pxPerUnit) <= 6)
				in += w[i];
		}
		return in / wsum;
	};

	const std::vector<P> marginHull = offsetPolygon(board.hull, OUTSIDE_MARGIN);
	auto poseH = [&](const double* params, double* H) {
		P c = applyL(board.centroid);
		H[0] = params[0] * L[0];
		H[1] = params[0] * L[1];
		H[2] = params[1] - params[0] * c.x;
		H[3] = params[0] * L[2];
		H[4] = params[0] * L[3];
		H[5] = params[2] - params[0] * c.y;
		H[6] = 0;
		H[7] = 0;
		H[8] = 1;
	};
	double minPX = 1e300, maxPX = -1e300, minPY = 1e300, maxPY = -1e300;
	for (P v : board.vertices) {
		P q = applyL(v);
		minPX = std::min(minPX, q.x);
		maxPX = std::max(maxPX, q.x);
		minPY = std::min(minPY, q.y);
		maxPY = std::max(maxPY, q.y);
	}
	const double priorMean[3] = {PRIOR_FILL * std::min(nw / (maxPX - minPX), nh / (maxPY - minPY)), nw / 2.0, nh / 2.0};
	const double priorStd[3] = {PRIOR_SCALE_STD * priorMean[0], PRIOR_CENTER_STD * std::min(nw, nh), PRIOR_CENTER_STD * std::min(nw, nh)};

	std::vector<P> polygon(marginHull.size());
	auto coarseLoss = [&](const double* params) {
		double prior = 0;
		for (int i = 0; i < 3; i++) {
			double z = (params[i] - priorMean[i]) / priorStd[i];
			prior += z * z;
		}
		prior *= 0.5;
		double H[9];
		poseH(params, H);
		for (size_t i = 0; i < marginHull.size(); i++)
			polygon[i] = toImage(H, marginHull[i]);
		double orientation = cross(polygon[1] - polygon[0], polygon[2] - polygon[0]) > 0 ? 1 : -1;
		double outside = 0;
		for (size_t j = 0; j < m; j++) {
			double lo = 0, hi = 1;
			for (size_t i = 0; i < polygon.size(); i++) {
				P p0 = polygon[i], p1 = polygon[(i + 1) % polygon.size()];
				P inward = orientation * P{-(p1 - p0).y, (p1 - p0).x};
				double num = dot(fitStart[j] - p0, inward), den = dot(fitDelta[j], inward);
				if (den > 0)
					lo = std::max(lo, -num / den);
				else if (den < 0)
					hi = std::min(hi, -num / den);
				else if (num < 0)
					hi = -1.0;
			}
			outside += fitStrength[j] * fitLengths[j] * (1 - std::min(1.0, std::max(0.0, hi - lo)));
		}
		return prior + OUTSIDE_WEIGHT * outside / fitStrengthLength;
	};

	double z[3] = {0, 0, 0};
	double best[3] = {priorMean[0], priorMean[1], priorMean[2]};
	double bestLoss = coarseLoss(best);
	for (int step = 0; step < COARSE_STEPS; step++) {
		double params[3], plus[3], minus[3], gradient[3];
		for (int i = 0; i < 3; i++)
			params[i] = priorMean[i] + z[i] * priorStd[i];
		double value = coarseLoss(params);
		for (int k = 0; k < 3; k++) {
			for (int i = 0; i < 3; i++) {
				plus[i] = priorMean[i] + (z[i] + (i == k ? 0.01 : 0)) * priorStd[i];
				minus[i] = priorMean[i] + (z[i] - (i == k ? 0.01 : 0)) * priorStd[i];
			}
			gradient[k] = (coarseLoss(plus) - coarseLoss(minus)) / 0.02;
		}
		double g = std::sqrt(gradient[0] * gradient[0] + gradient[1] * gradient[1] + gradient[2] * gradient[2]);
		if (g < 1e-9)
			break;
		double stepLength = std::min(COARSE_MAX_STEP, COARSE_RATE * value);
		for (int i = 0; i < 3; i++) {
			z[i] -= stepLength * gradient[i] / g;
			params[i] = priorMean[i] + z[i] * priorStd[i];
		}
		double l = coarseLoss(params);
		if (l < bestLoss) {
			bestLoss = l;
			std::copy(params, params + 3, best);
		}
	}
	std::copy(best, best + 3, result.coarse);

	auto fineLoss = [&](const Vec& p) {
		double H[9];
		poseH(p.data(), H);
		return clippedLoss(H, fitMids, fitDirs, fitW, fitWSum, FIT_CLIPS[3], p[0]);
	};
	const double halfCell = 0.5 * best[0];
	Vec start(3);
	double startLoss = 1e300;
	for (int a = 0; a < 11; a++)
		for (int b = 0; b < 11; b++)
			for (int c = 0; c < 11; c++) {
				Vec p = {best[0] * linspace(0.9, 1.1, 11, a), best[1] + linspace(-halfCell, halfCell, 11, b), best[2] + linspace(-halfCell, halfCell, 11, c)};
				double l = fineLoss(p);
				if (l < startLoss) {
					startLoss = l;
					start = p;
				}
			}
	Vec pose = nelderMead(fineLoss, start, 1e-3, 1e-6, 4000);
	for (int iter = 0; iter < 8; iter++) {
		Vec bestShift = pose;
		double bestShiftLoss = coarseLoss(pose.data());
		for (int a = 0; a < 360; a += 60) {
			P step = applyL(unit(a));
			Vec shifted = {pose[0], pose[1] + pose[0] * step.x, pose[2] + pose[0] * step.y};
			double l = coarseLoss(shifted.data());
			if (l < bestShiftLoss) {
				bestShiftLoss = l;
				bestShift = shifted;
			}
		}
		if (bestShift == pose)
			break;
		pose = bestShift;
	}
	double Haffine[9];
	poseH(pose.data(), Haffine);
	const double pxPerUnit = pose[0];
	lap("pose");

	// §6.3 projective refinement with keystone bound, affine fallback
	std::vector<P> ends;
	std::vector<int> endDirs;
	std::vector<double> endW;
	double endWSum = 0;
	for (int half = 0; half < 2; half++)
		for (size_t j = 0; j < m; j++) {
			const Seg& s = segs[fit[j]];
			ends.push_back(half ? P{s.x2, s.y2} : P{s.x1, s.y1});
			endDirs.push_back(fitDirs[j]);
			endW.push_back(fitW[j]);
			endWSum += fitW[j];
		}
	Vec x(Haffine, Haffine + 8);
	Vec xScale(8);
	for (int i = 0; i < 8; i++)
		xScale[i] = std::fabs(x[i]) + (i >= 6 ? 1e-4 : 0);
	auto boundedLoss = [&](const Vec& vector, double clip) {
		double wMin = 1e300, wMax = -1e300;
		for (P v : board.vertices) {
			double w = v.x * vector[6] + v.y * vector[7] + 1;
			wMin = std::min(wMin, w);
			wMax = std::max(wMax, w);
		}
		if (wMin <= 0 || wMax / wMin > MAX_KEYSTONE)
			return HUGE_VAL;
		double H[9];
		std::copy(vector.begin(), vector.end(), H);
		H[8] = 1;
		return clippedLoss(H, ends, endDirs, endW, endWSum, clip, pxPerUnit);
	};
	Vec trial(8);
	for (double clip : FIT_CLIPS) {
		Vec y = powell([&](const Vec& yy) {
			for (int i = 0; i < 8; i++)
				trial[i] = x[i] + yy[i] * xScale[i];
			return boundedLoss(trial, clip);
		}, Vec(8, 0.0), 1e-5, 1e-9, 20000);
		for (int i = 0; i < 8; i++)
			x[i] += y[i] * xScale[i];
	}
	double H[9];
	std::copy(x.begin(), x.end(), H);
	H[8] = 1;
	double shareProjective = inlierShare(H, ends, endDirs, endW, endWSum, pxPerUnit);
	double shareAffine = inlierShare(Haffine, ends, endDirs, endW, endWSum, pxPerUnit);
	result.projective = !(shareProjective < shareAffine);
	if (!result.projective)
		std::copy(Haffine, Haffine + 9, H);
	result.inlierShare = std::max(shareProjective, shareAffine);
	std::copy(H, H + 9, result.H);
	for (int i = 0; i < 9; i++)
		result.Hsource[i] = i < 6 ? H[i] * (1 / scale) : H[i];  // np.diag([1 / scale, 1 / scale, 1]) @ H
	lap("projective");

	// §8 edge evidence
	std::vector<double> strengths(n);
	for (size_t i = 0; i < n; i++)
		strengths[i] = segs[i].strength;
	const double strengthRef = percentile(strengths, 90);
	const size_t edgeCount = board.internal.size();
	std::vector<std::pair<P, P>> projected(edgeCount);
	result.confidence.assign(edgeCount, 0);
	for (size_t e = 0; e < edgeCount; e++) {
		P a = toImage(H, board.internal[e].first), b = toImage(H, board.internal[e].second);
		projected[e] = {a, b};
		double length = norm(b - a);
		P u = (1 / length) * (b - a);
		P nrm = {-u.y, u.x};
		float theta = float(rem(std::atan2(u.y, u.x) * (180 / PI), 180));
		double level[EDGE_SAMPLES] = {0};
		for (size_t i = 0; i < n; i++) {
			if (!(std::fabs(remF(angles[i] - theta + 90.f, 180.f) - 90.f) <= float(EDGE_ANGLE_TOLERANCE)))
				continue;
			const Seg& s = segs[i];
			P p1 = P{s.x1, s.y1} - a, p2 = P{s.x2, s.y2} - a;
			double t1 = dot(p1, u) / length, t2 = dot(p2, u) / length;
			double o1 = dot(p1, nrm), o2 = dot(p2, nrm);
			if (std::fabs(t2 - t1) < 1e-9)
				continue;
			double lo = std::max(0.0, std::min(t1, t2)), hi = std::min(1.0, std::max(t1, t2));
			if (hi <= lo)
				continue;
			auto offset = [&](double t) { return o1 + (o2 - o1) * (t - t1) / (t2 - t1); };
			if (std::max(std::fabs(offset(lo)), std::fabs(offset(hi))) > EDGE_OFFSET_TOLERANCE * length)
				continue;
			double contribution = std::min(1.0, s.strength / strengthRef);
			for (int k = 0; k < EDGE_SAMPLES; k++) {
				double sample = (k + 0.5) / EDGE_SAMPLES;
				if (sample >= lo && sample <= hi)
					level[k] = std::max(level[k], contribution);
			}
		}
		double sum = 0;
		for (double v : level)
			sum += v;
		result.confidence[e] = sum / EDGE_SAMPLES;
	}
	result.edgeCells = board.pairs;
	lap("evidence");

	// §9 cut tier by tier, rejecting a batch's edges around regions under 6 cells
	std::vector<uint8_t> cut(edgeCount, 0);
	double upper = HUGE_VAL;
	for (double threshold : EDGE_THRESHOLDS_DESC) {
		std::vector<uint8_t> batch(edgeCount), trialCut(edgeCount);
		for (size_t e = 0; e < edgeCount; e++) {
			batch[e] = result.confidence[e] >= threshold && result.confidence[e] < upper;
			trialCut[e] = cut[e] || batch[e];
		}
		upper = threshold;
		for (;;) {
			std::vector<int> labels = regionLabels(cells, board.pairs, trialCut);
			std::vector<int> sizes = bincount(labels);
			bool any = false;
			for (size_t e = 0; e < edgeCount; e++) {
				bool touching = sizes[labels[board.pairs[e].first]] < PIECE_CELLS || sizes[labels[board.pairs[e].second]] < PIECE_CELLS;
				if (touching && batch[e] && trialCut[e]) {
					trialCut[e] = 0;
					any = true;
				}
			}
			bool small = false;
			for (int s : sizes)
				small = small || s < PIECE_CELLS;
			if (!small || !any)
				break;
		}
		cut = trialCut;
	}
	lap("partition");

	// §10 colour-guided split of under-partitioned regions
	const double edgePx = [&]() {
		double total = 0;
		for (const auto& e : board.internal)
			total += norm(toImage(result.Hsource, e.second) - toImage(result.Hsource, e.first));
		return total / edgeCount;
	}();
	auto sourceTriangle = [&](int cell) {
		std::array<P, 3> t;
		for (int i = 0; i < 3; i++)
			t[i] = toImage(result.Hsource, board.triangles[cell][i]);
		return t;
	};
	std::vector<int> labels = regionLabels(cells, board.pairs, cut);
	std::vector<int> sizes = bincount(labels);
	// Per-cell colours only matter when some region is still over 6 cells; skip the full-resolution sampling otherwise.
	const bool underPartitioned = std::any_of(sizes.begin(), sizes.end(), [](int s) { return s > PIECE_CELLS; });
	const int cellErode = int(std::nearbyint(0.08 * edgePx));
	std::vector<double> cellHue(cells, std::numeric_limits<double>::quiet_NaN()), cellValue(cells, std::numeric_limits<double>::quiet_NaN());
	for (int c = 0; underPartitioned && c < cells; c++) {
		ColourStats stats = maskStats(rasterize({sourceTriangle(c)}, cellErode, input.width, input.height), input);
		if (stats.count) {
			cellHue[c] = stats.hue();
			cellValue[c] = stats.meanValue();
		}
	}
	auto deviations = [&](const std::vector<int>& set, std::vector<double>& hueDev, std::vector<double>& valueDev) {
		size_t k = set.size();
		size_t centerIndex = 0;
		double bestSum = 1e300;
		for (size_t i = 0; i < k; i++) {
			double sum = 0;
			for (size_t j = 0; j < k; j++)
				sum += std::fabs(rem(cellHue[set[i]] - cellHue[set[j]] + 180, 360) - 180);
			if (sum < bestSum) {
				bestSum = sum;
				centerIndex = i;
			}
		}
		std::vector<double> values;
		for (int c : set)
			values.push_back(cellValue[c]);
		double valueMedian = median(values);
		hueDev.clear();
		valueDev.clear();
		for (int c : set) {
			hueDev.push_back(std::fabs(rem(cellHue[c] - cellHue[set[centerIndex]] + 180, 360) - 180));
			valueDev.push_back(std::fabs(cellValue[c] - valueMedian));
		}
	};
	std::vector<double> refHue, refValue;
	for (size_t region = 0; region < sizes.size(); region++) {
		if (sizes[region] != PIECE_CELLS)
			continue;
		std::vector<int> set;
		for (int c = 0; c < cells; c++)
			if (labels[c] == int(region))
				set.push_back(c);
		std::vector<double> h, v;
		deviations(set, h, v);
		refHue.insert(refHue.end(), h.begin(), h.end());
		refValue.insert(refValue.end(), v.begin(), v.end());
	}
	std::vector<uint8_t> blank(cells, 0);
	if (underPartitioned && !refHue.empty()) {
		result.hueThreshold = percentile(refHue, 95);
		result.valueThreshold = percentile(refValue, 95);
		auto spread = [&](const std::vector<int>& set) {
			std::vector<double> h, v;
			deviations(set, h, v);
			double worst = 0;
			for (size_t i = 0; i < h.size(); i++) {
				if (std::isnan(h[i]) || std::isnan(v[i]))
					return HUGE_VAL;
				worst = std::max(worst, std::max(h[i] / result.hueThreshold, v[i] / result.valueThreshold));
			}
			return worst;
		};
		auto toSet = [](const Bits& bits) {
			std::vector<int> set;
			for (int i = 0; i < 128; i++)
				if (bits.has(i))
					set.push_back(i);
			return set;
		};
		std::vector<Bits> queue;
		for (size_t region = 0; region < sizes.size(); region++) {
			if (sizes[region] <= PIECE_CELLS)
				continue;
			Bits bits;
			for (int c = 0; c < cells; c++)
				if (labels[c] == int(region))
					bits.set(c);
			queue.push_back(bits);
		}
		while (!queue.empty()) {
			Bits region = queue.back();
			queue.pop_back();
			std::vector<int> regionCells = toSet(region);
			if (spread(regionCells) <= 1) {
				for (int c : regionCells)
					blank[c] = 1;
				continue;
			}
			std::vector<std::vector<int>> neighbors(cells);
			for (size_t e = 0; e < edgeCount; e++)
				if (!cut[e]) {
					neighbors[board.pairs[e].first].push_back(board.pairs[e].second);
					neighbors[board.pairs[e].second].push_back(board.pairs[e].first);
				}
			for (auto& list : neighbors)
				std::sort(list.begin(), list.end());
			auto components = [&](Bits set) {
				std::vector<Bits> parts;
				for (int c = 0; c < cells; c++) {
					if (!set.has(c))
						continue;
					Bits part;
					std::vector<int> stack = {c};
					set.w[c >> 6] &= ~(uint64_t(1) << (c & 63));
					while (!stack.empty()) {
						int cell = stack.back();
						stack.pop_back();
						part.set(cell);
						for (int nb : neighbors[cell])
							if (set.has(nb)) {
								set.w[nb >> 6] &= ~(uint64_t(1) << (nb & 63));
								stack.push_back(nb);
							}
					}
					parts.push_back(part);
				}
				return parts;
			};
			// Every connected 6-cell subset, grown by frontier extension through uncut edges.
			std::unordered_set<Bits, BitsHash> seen;
			std::vector<Bits> stack;
			for (int c : regionCells) {
				Bits b;
				b.set(c);
				stack.push_back(b);
			}
			bool found = false;
			bool bestSmall = true;
			double bestScore = 0;
			Bits bestPart;
			std::vector<Bits> bestRest;
			while (!stack.empty()) {
				Bits current = stack.back();
				stack.pop_back();
				if (!seen.insert(current).second)
					continue;
				if (current.count() == PIECE_CELLS) {
					std::vector<int> part = toSet(current);
					double score = spread(part);
					if (score > 1)
						continue;
					Bits rest = {{region.w[0] & ~current.w[0], region.w[1] & ~current.w[1]}};
					std::vector<Bits> restParts = components(rest);
					bool small = false;
					for (const Bits& r : restParts)
						small = small || r.count() < PIECE_CELLS;
					if (!found || small < bestSmall || (small == bestSmall && score < bestScore)) {
						found = true;
						bestSmall = small;
						bestScore = score;
						bestPart = current;
						bestRest = restParts;
					}
					continue;
				}
				for (int c = 0; c < cells; c++) {
					if (!current.has(c))
						continue;
					for (int nb : neighbors[c]) {
						if (region.has(nb) && !current.has(nb)) {
							Bits grown = current;
							grown.set(nb);
							stack.push_back(grown);
						}
					}
				}
			}
			if (!found) {
				for (int c : regionCells)
					blank[c] = 1;
				continue;
			}
			for (size_t e = 0; e < edgeCount; e++) {
				int a = board.pairs[e].first, b = board.pairs[e].second;
				if (region.has(a) && region.has(b) && bestPart.has(a) != bestPart.has(b))
					cut[e] = 1;
			}
			for (const Bits& r : bestRest) {
				if (r.count() > PIECE_CELLS)
					queue.push_back(r);
				else if (r.count() < PIECE_CELLS)
					for (int c : toSet(r))
						blank[c] = 1;
			}
		}
	}
	result.cut = cut;
	lap("split");

	// §11 regions and their photo colours
	labels = regionLabels(cells, board.pairs, cut);
	sizes = bincount(labels);
	const int blockErode = int(std::nearbyint(0.12 * edgePx));
	for (size_t r = 0; r < sizes.size(); r++) {
		Region region;
		std::vector<std::array<P, 3>> tris;
		region.blank = true;
		for (int c = 0; c < cells; c++)
			if (labels[c] == int(r)) {
				region.cells.push_back(c);
				region.blank = region.blank && blank[c];
				tris.push_back(sourceTriangle(c));
			}
		ColourStats stats = maskStats(rasterize(tris, blockErode, input.width, input.height), input);
		if (!stats.count)
			region.insidePhoto = false;
		else {
			region.hue = stats.hue();
			region.saturation = stats.medianSaturation();
			region.value = stats.valueMode();
			// cv2 HSV2RGB of (round(hue/2) % 180, round(sat), round(value)).
			double hh = double(int(std::nearbyint(region.hue / 2)) % 180) * 2, ss = std::nearbyint(region.saturation) / 255, vv = std::nearbyint(region.value) / 255;
			double c = vv * ss, hp = hh / 60, xx = c * (1 - std::fabs(rem(hp, 2) - 1));
			double rgb[3] = {0, 0, 0};
			int sector = int(hp) % 6;
			const int order[6][3] = {{0, 1, 2}, {1, 0, 2}, {2, 0, 1}, {2, 1, 0}, {1, 2, 0}, {0, 2, 1}};
			double values[3] = {c, xx, 0};
			for (int i = 0; i < 3; i++)
				rgb[i] = values[order[sector][i]] + (vv - c);
			for (int i = 0; i < 3; i++)
				region.rgb[i] = int(std::nearbyint(rgb[i] * 255));
		}
		result.regions.push_back(region);
	}
	lap("colours");
	result.ok = true;
	return result;
}

}
