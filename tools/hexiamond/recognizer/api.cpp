// C ABI for the wasm build (and the native CLI): one call takes pixels + board rows and returns a JSON string.
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <string>

#include "recognizer.hpp"

#if defined(__wasm__)
#define HX_EXPORT extern "C" __attribute__((used, visibility("default")))
// libc++'s default verbose abort formats its message with printf and pulls stdio (and WASI fd_* imports) in.
namespace std {
inline namespace __2 {
[[noreturn]] void __libcpp_verbose_abort (const char*, ...) noexcept { __builtin_trap(); }
}
}
#else
#define HX_EXPORT extern "C"
#endif

namespace hx {

namespace {

// Fixed-point formatting, up to 9 decimals with trailing zeros trimmed; avoids pulling printf into the wasm.
void appendNumber (std::string& out, double value) {
	if (!std::isfinite(value)) {
		out += "null";
		return;
	}
	if (value < 0) {
		out += '-';
		value = -value;
	}
	const uint64_t SCALE = 1000000000ull;
	if (value >= 9.0e9) {
		out += std::to_string(uint64_t(value));
		return;
	}
	uint64_t fixed = uint64_t(std::llround(value * double(SCALE)));
	out += std::to_string(fixed / SCALE);
	uint64_t frac = fixed % SCALE;
	if (frac) {
		std::string digits = std::to_string(frac);
		digits.insert(0, 9 - digits.size(), '0');
		digits.erase(digits.find_last_not_of('0') + 1);
		out += '.';
		out += digits;
	}
}

void appendArray (std::string& out, const double* values, size_t count) {
	out += '[';
	for (size_t i = 0; i < count; i++) {
		if (i)
			out += ',';
		appendNumber(out, values[i]);
	}
	out += ']';
}

}

std::string toJson (const RecognizeResult& r) {
	std::string out = "{\"ok\":";
	out += r.ok ? "true" : "false";
	if (!r.error.empty())
		out += ",\"error\":\"" + r.error + "\"";
	out += ",\"normalized\":[" + std::to_string(r.normalizedWidth) + "," + std::to_string(r.normalizedHeight) + "],\"scale\":";
	appendNumber(out, r.scale);
	out += ",\"segments\":" + std::to_string(r.segmentCount) + ",\"window\":" + std::to_string(r.windowCount) + ",\"peak\":";
	appendNumber(out, r.peak);
	out += ",\"modes\":";
	appendArray(out, r.modes, 3);
	out += ",\"coarse\":";
	appendArray(out, r.coarse, 3);
	out += ",\"H\":";
	appendArray(out, r.H, 9);
	out += ",\"Hsource\":";
	appendArray(out, r.Hsource, 9);
	out += std::string(",\"projective\":") + (r.projective ? "true" : "false") + ",\"inlierShare\":";
	appendNumber(out, r.inlierShare);
	out += ",\"edges\":[";
	for (size_t e = 0; e < r.edgeCells.size(); e++) {
		if (e)
			out += ',';
		out += '[' + std::to_string(r.edgeCells[e].first) + ',' + std::to_string(r.edgeCells[e].second) + ',';
		appendNumber(out, r.confidence[e]);
		out += ',' + std::to_string(int(r.cut[e])) + ']';
	}
	out += "],\"hueThreshold\":";
	appendNumber(out, r.hueThreshold);
	out += ",\"valueThreshold\":";
	appendNumber(out, r.valueThreshold);
	out += ",\"regions\":[";
	for (size_t i = 0; i < r.regions.size(); i++) {
		const Region& g = r.regions[i];
		if (i)
			out += ',';
		out += "{\"cells\":[";
		for (size_t c = 0; c < g.cells.size(); c++) {
			if (c)
				out += ',';
			out += std::to_string(g.cells[c]);
		}
		out += std::string("],\"blank\":") + (g.blank ? "true" : "false") + ",\"insidePhoto\":" + (g.insidePhoto ? "true" : "false") + ",\"hue\":";
		appendNumber(out, g.hue);
		out += ",\"saturation\":";
		appendNumber(out, g.saturation);
		out += ",\"value\":";
		appendNumber(out, g.value);
		out += ",\"rgb\":[" + std::to_string(g.rgb[0]) + ',' + std::to_string(g.rgb[1]) + ',' + std::to_string(g.rgb[2]) + "]}";
	}
	out += "],\"timing\":{";
	for (size_t i = 0; i < r.timing.size(); i++) {
		if (i)
			out += ',';
		out += std::string("\"") + r.timing[i].first + "\":";
		appendNumber(out, std::round(r.timing[i].second * 100) / 100);
	}
	out += "}}";
	return out;
}

}

namespace {
std::string lastResult;
}

HX_EXPORT void* hx_alloc (size_t size) { return std::malloc(size); }

HX_EXPORT void hx_free (void* pointer) { std::free(pointer); }

// pixels: interleaved 8-bit, `channels` (3/4) per pixel, `bgr` != 0 for BGR order. board: rows x cols ints, row-major,
// shape.board padded with zeros. Returns a NUL-terminated JSON string owned by the module (valid until the next call).
HX_EXPORT const char* hx_recognize (const uint8_t* pixels, int width, int height, int channels, int bgr, const int32_t* board, int rows, int cols) {
	hx::RecognizeInput input;
	input.pixels = pixels;
	input.width = width;
	input.height = height;
	input.channels = channels;
	input.bgr = bgr != 0;
	input.board.assign(size_t(rows), std::vector<int>(size_t(cols)));
	for (int y = 0; y < rows; y++)
		for (int x = 0; x < cols; x++)
			input.board[y][x] = board[size_t(y) * cols + x];
	lastResult = hx::toJson(hx::recognize(input));
	return lastResult.c_str();
}

HX_EXPORT int hx_result_length (void) { return int(lastResult.size()); }
