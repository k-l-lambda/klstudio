// Hexiamond board recognition from a photo: C++ port of app/hexiamond/photo-recognition.ipynb.
#pragma once

#include <cstdint>
#include <string>
#include <vector>

// Millisecond clock for the per-stage timings: imported from the host (performance.now) in the wasm build,
// defined by the native CLI otherwise.
#if defined(__wasm__)
extern "C" __attribute__((import_module("env"), import_name("now"))) double hx_now (void);
#else
extern "C" double hx_now (void);
#endif

namespace hx {

struct RecognizeInput {
	const uint8_t* pixels = nullptr;  // interleaved, row-major, no padding
	int width = 0;
	int height = 0;
	int channels = 4;                 // 3 or 4
	bool bgr = false;                 // channel order of the first three bytes; RGBA from a canvas is false
	std::vector<std::vector<int>> board;  // shape.board rows from data.ts, packed-x occupancy (> 0 = cell)
};

struct Region {
	std::vector<int> cells;  // board point indices, buildShape's boardPoints order
	bool blank = false;
	bool insidePhoto = true;
	double hue = 0;          // degrees [0, 360)
	double saturation = 0;   // 0..255, median
	double value = 0;        // 0..255, histogram mode
	int rgb[3] = {0, 0, 0};
};

struct RecognizeResult {
	bool ok = false;
	std::string error;
	int normalizedWidth = 0;
	int normalizedHeight = 0;
	double scale = 0;               // normalized px per source px
	int segmentCount = 0;
	int windowCount = 0;
	double peak = 0;
	double modes[3] = {0, 0, 0};
	double coarse[3] = {0, 0, 0};   // scale px per edge, centroid x, y (normalized px)
	double H[9] = {0};              // board units -> normalized px
	double Hsource[9] = {0};        // board units -> source px
	bool projective = false;        // false: the projective fit lost to the affine one
	double inlierShare = 0;
	std::vector<std::pair<int, int>> edgeCells;  // internal edges as (cell, cell)
	std::vector<double> confidence;
	std::vector<uint8_t> cut;                   // final cuts per internal edge
	std::vector<Region> regions;
	double hueThreshold = 0;
	double valueThreshold = 0;
	std::vector<std::pair<const char*, double>> timing;  // ms per stage
};

RecognizeResult recognize (const RecognizeInput& input);

std::string toJson (const RecognizeResult& result);

}
