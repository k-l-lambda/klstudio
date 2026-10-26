// Native CLI for parity tests and profiling: hexiamond-recognizer <raw> <width> <height> <channels> <bgr> <board.json-rows>
// <raw> holds the interleaved pixels; board rows are passed as "1,1,1;1,1,1,1,1;..." (packed-x occupancy per row).
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>

#include "recognizer.hpp"

extern "C" double hx_now (void) {
	return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now().time_since_epoch()).count();
}

extern "C" const char* hx_recognize (const uint8_t* pixels, int width, int height, int channels, int bgr, const int32_t* board, int rows, int cols);

int main (int argc, char** argv) {
	if (argc < 7) {
		std::fprintf(stderr, "usage: %s raw width height channels bgr rows\n", argv[0]);
		return 2;
	}
	int width = std::atoi(argv[2]), height = std::atoi(argv[3]), channels = std::atoi(argv[4]), bgr = std::atoi(argv[5]);
	std::vector<uint8_t> pixels(size_t(width) * height * channels);
	FILE* file = std::fopen(argv[1], "rb");
	if (!file || std::fread(pixels.data(), 1, pixels.size(), file) != pixels.size()) {
		std::fprintf(stderr, "cannot read %s\n", argv[1]);
		return 1;
	}
	std::fclose(file);
	std::vector<std::vector<int>> rows(1);
	for (const char* p = argv[6]; *p; p++) {
		if (*p == ';')
			rows.emplace_back();
		else if (*p >= '0' && *p <= '9')
			rows.back().push_back(*p - '0');
	}
	size_t cols = 0;
	for (const auto& row : rows)
		cols = std::max(cols, row.size());
	std::vector<int32_t> board(rows.size() * cols, 0);
	for (size_t y = 0; y < rows.size(); y++)
		for (size_t x = 0; x < rows[y].size(); x++)
			board[y * cols + x] = rows[y][x];
	std::puts(hx_recognize(pixels.data(), width, height, channels, bgr, board.data(), int(rows.size()), int(cols)));
	return 0;
}
