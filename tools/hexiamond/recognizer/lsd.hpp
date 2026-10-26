// Line Segment Detector, LSD_REFINE_STD only, ported from OpenCV 4.9 modules/imgproc/src/lsd.cpp onto plain buffers.
#pragma once

#include <vector>

#include "imgproc.hpp"

namespace hx {

struct Segment {
	float x1, y1, x2, y2;
};

// cv::createLineSegmentDetector(LSD_REFINE_STD) with default parameters (scale 0.8, sigma_scale 0.6, quant 2, ang_th 22.5, density_th 0.7, n_bins 1024).
std::vector<Segment> detectLineSegments (const Gray8& image);

}
