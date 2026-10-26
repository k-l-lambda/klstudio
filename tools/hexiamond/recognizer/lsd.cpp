/*M///////////////////////////////////////////////////////////////////////////////////////
//
//  IMPORTANT: READ BEFORE DOWNLOADING, COPYING, INSTALLING OR USING.
//
//  By downloading, copying, installing or using the software you agree to this license.
//  If you do not agree to this license, do not download, install,
//  copy or use the software.
//
//
//                           License Agreement
//                For Open Source Computer Vision Library
//
// Copyright (C) 2013, OpenCV Foundation, all rights reserved.
// Third party copyrights are property of their respective owners.
//
// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//
//   * The name of the copyright holders may not be used to endorse or promote products
//     derived from this software without specific prior written permission.
//
// This software is provided by the copyright holders and contributors "as is" and
// any express or implied warranties, including, but not limited to, the implied
// warranties of merchantability and fitness for a particular purpose are disclaimed.
// In no event shall the Intel Corporation or contributors be liable for any direct,
// indirect, incidental, special, exemplary, or consequential damages
// (including, but not limited to, procurement of substitute goods or services;
// loss of use, data, or profits; or business interruption) however caused
// and on any theory of liability, whether in contract, strict liability,
// or tort (including negligence or otherwise) arising in any way out of
// the use of this software, even if advised of the possibility of such damage.
//
//M*/

// Ported from OpenCV 4.9 modules/imgproc/src/lsd.cpp (LSD_REFINE_STD path only): cv::Mat replaced by flat
// buffers, Point/Vec by plain structs; the arithmetic, including float vs double choices and
// cv::fastAtan2, is kept as in the original so results match cv2.createLineSegmentDetector.

#include "lsd.hpp"

#include <algorithm>
#include <cfloat>
#include <cmath>
#include <cstdint>

namespace hx {

namespace {

const double PI = 3.1415926535897932384626433832795;
const double M_3_2_PI_ = (3 * PI) / 2;
const double M_2__PI_ = 2 * PI;
const double NOTDEF = -1024.0;
const uint8_t NOTUSED = 0;
const uint8_t USED = 1;
const double DEG_TO_RADS = PI / 180;

const double SCALE = 0.8;
const double SIGMA_SCALE = 0.6;
const double QUANT = 2.0;
const double ANG_TH = 22.5;
const double DENSITY_TH = 0.7;
const int N_BINS = 1024;

// cv::fastAtan2 (degrees, [0, 360)).
float fastAtan2 (float y, float x) {
	static const float p1 = 0.9997878412794807f * float(180 / PI);
	static const float p3 = -0.3258083974640975f * float(180 / PI);
	static const float p5 = 0.1555786518463281f * float(180 / PI);
	static const float p7 = -0.04432655554792128f * float(180 / PI);
	float ax = std::fabs(x), ay = std::fabs(y);
	float a, c, c2;
	if (ax >= ay) {
		c = ay / (ax + float(DBL_EPSILON));
		c2 = c * c;
		a = (((p7 * c2 + p5) * c2 + p3) * c2 + p1) * c;
	}
	else {
		c = ax / (ay + float(DBL_EPSILON));
		c2 = c * c;
		a = 90.f - (((p7 * c2 + p5) * c2 + p3) * c2 + p1) * c;
	}
	if (x < 0)
		a = 180.f - a;
	if (y < 0)
		a = 360.f - a;
	return a;
}

inline double distSq (double x1, double y1, double x2, double y2) { return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1); }
inline double dist (double x1, double y1, double x2, double y2) { return std::sqrt(distSq(x1, y1, x2, y2)); }

inline double angleDiffSigned (double a, double b) {
	double diff = a - b;
	while (diff <= -PI)
		diff += M_2__PI_;
	while (diff > PI)
		diff -= M_2__PI_;
	return diff;
}

inline double angleDiff (double a, double b) { return std::fabs(angleDiffSigned(a, b)); }

struct RegionPoint {
	int x;
	int y;
	size_t used;
	double angle;
	double modgrad;
};

struct NormPoint {
	int x;
	int y;
	int norm;
};

struct Rect {
	double x1, y1, x2, y2;
	double width;
	double x, y;
	double theta;
	double dx, dy;
	double prec;
	double p;
};

class Detector {
public:
	std::vector<Segment> run (const Gray8& image);

private:
	Gray8 scaled;
	std::vector<double> angles;
	std::vector<double> modgrad;
	std::vector<uint8_t> used;
	std::vector<NormPoint> ordered;
	int width = 0;
	int height = 0;

	void llAngle (double threshold, unsigned nBins);
	void regionGrow (int sx, int sy, std::vector<RegionPoint>& reg, double& regAngle, double prec);
	void region2rect (const std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec) const;
	double getTheta (const std::vector<RegionPoint>& reg, double x, double y, double regAngle, double prec) const;
	bool refine (std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec, double densityTh);
	bool reduceRegionRadius (std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec, double density, double densityTh);
	bool isAligned (int x, int y, double theta, double prec) const;
};

std::vector<Segment> Detector::run (const Gray8& image) {
	std::vector<Segment> lines;
	const double prec = PI * ANG_TH / 180;
	const double p = ANG_TH / 180;
	const double rho = QUANT / std::sin(prec);

	const double sigma = SIGMA_SCALE / SCALE;
	const double sprec = 3;
	const unsigned h = unsigned(std::ceil(sigma * std::sqrt(2 * sprec * std::log(10.0))));
	scaled = resizeLinearExact(gaussianBlur(image, int(1 + 2 * h), sigma), SCALE);
	llAngle(rho, N_BINS);

	const double logNT = 5 * (std::log10(double(width)) + std::log10(double(height))) / 2 + std::log10(11.0);
	const size_t minRegSize = size_t(-logNT / std::log10(p));

	used.assign(size_t(width) * height, NOTUSED);
	std::vector<RegionPoint> reg;
	for (size_t i = 0; i < ordered.size(); ++i) {
		const NormPoint& point = ordered[i];
		size_t index = size_t(point.y) * width + point.x;
		if (used[index] == NOTUSED && angles[index] != NOTDEF) {
			double regAngle;
			regionGrow(point.x, point.y, reg, regAngle, prec);
			if (reg.size() < minRegSize)
				continue;
			Rect rec;
			region2rect(reg, regAngle, prec, p, rec);
			if (!refine(reg, regAngle, prec, p, rec, DENSITY_TH))
				continue;
			rec.x1 += 0.5;
			rec.y1 += 0.5;
			rec.x2 += 0.5;
			rec.y2 += 0.5;
			rec.x1 /= SCALE;
			rec.y1 /= SCALE;
			rec.x2 /= SCALE;
			rec.y2 /= SCALE;
			lines.push_back({float(rec.x1), float(rec.y1), float(rec.x2), float(rec.y2)});
		}
	}
	return lines;
}

void Detector::llAngle (double threshold, unsigned nBins) {
	width = scaled.width;
	height = scaled.height;
	angles.assign(size_t(width) * height, 0);
	modgrad.assign(size_t(width) * height, 0);
	for (int x = 0; x < width; x++)
		angles[size_t(height - 1) * width + x] = NOTDEF;
	for (int y = 0; y < height; y++)
		angles[size_t(y) * width + width - 1] = NOTDEF;

	double maxGrad = -1;
	for (int y = 0; y < height - 1; ++y) {
		const uint8_t* row = scaled.row(y);
		const uint8_t* next = scaled.row(y + 1);
		double* angleRow = angles.data() + size_t(y) * width;
		double* gradRow = modgrad.data() + size_t(y) * width;
		for (int x = 0; x < width - 1; ++x) {
			int DA = next[x + 1] - row[x];
			int BC = row[x + 1] - next[x];
			int gx = DA + BC;
			int gy = DA - BC;
			double norm = std::sqrt((gx * gx + gy * gy) / 4.0);
			gradRow[x] = norm;
			if (norm <= threshold)
				angleRow[x] = NOTDEF;
			else {
				angleRow[x] = fastAtan2(float(gx), float(-gy)) * DEG_TO_RADS;
				if (norm > maxGrad)
					maxGrad = norm;
			}
		}
	}

	double binCoef = maxGrad > 0 ? double(nBins - 1) / maxGrad : 0;
	// OpenCV stable_sorts the points by descending bin; a stable counting sort over the bins gives the same order in O(n).
	std::vector<size_t> start(nBins + 1, 0);
	for (int y = 0; y < height - 1; ++y) {
		const double* gradRow = modgrad.data() + size_t(y) * width;
		for (int x = 0; x < width - 1; ++x)
			start[nBins - 1 - int(gradRow[x] * binCoef) + 1]++;
	}
	for (unsigned b = 0; b < nBins; b++)
		start[b + 1] += start[b];
	ordered.resize(size_t(width - 1) * (height - 1));
	for (int y = 0; y < height - 1; ++y) {
		const double* gradRow = modgrad.data() + size_t(y) * width;
		for (int x = 0; x < width - 1; ++x) {
			int norm = int(gradRow[x] * binCoef);
			ordered[start[nBins - 1 - norm]++] = {x, y, norm};
		}
	}
}

void Detector::regionGrow (int sx, int sy, std::vector<RegionPoint>& reg, double& regAngle, double prec) {
	reg.clear();
	size_t seedIndex = size_t(sy) * width + sx;
	regAngle = angles[seedIndex];
	reg.push_back({sx, sy, seedIndex, regAngle, modgrad[seedIndex]});
	float sumdx = float(std::cos(regAngle));
	float sumdy = float(std::sin(regAngle));
	used[seedIndex] = USED;

	for (size_t i = 0; i < reg.size(); i++) {
		const int px = reg[i].x, py = reg[i].y;
		int xxMin = std::max(px - 1, 0), xxMax = std::min(px + 1, width - 1);
		int yyMin = std::max(py - 1, 0), yyMax = std::min(py + 1, height - 1);
		for (int yy = yyMin; yy <= yyMax; ++yy) {
			for (int xx = xxMin; xx <= xxMax; ++xx) {
				size_t index = size_t(yy) * width + xx;
				if (used[index] != USED && isAligned(xx, yy, regAngle, prec)) {
					const double angle = angles[index];
					used[index] = USED;
					reg.push_back({xx, yy, index, angle, modgrad[index]});
					sumdx += std::cos(float(angle));
					sumdy += std::sin(float(angle));
					regAngle = fastAtan2(sumdy, sumdx) * DEG_TO_RADS;
				}
			}
		}
	}
}

void Detector::region2rect (const std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec) const {
	double x = 0, y = 0, sum = 0;
	for (const RegionPoint& point : reg) {
		x += double(point.x) * point.modgrad;
		y += double(point.y) * point.modgrad;
		sum += point.modgrad;
	}
	x /= sum;
	y /= sum;
	double theta = getTheta(reg, x, y, regAngle, prec);
	double dx = std::cos(theta), dy = std::sin(theta);
	double lMin = 0, lMax = 0, wMin = 0, wMax = 0;
	for (const RegionPoint& point : reg) {
		double regdx = double(point.x) - x;
		double regdy = double(point.y) - y;
		double l = regdx * dx + regdy * dy;
		double w = -regdx * dy + regdy * dx;
		if (l > lMax)
			lMax = l;
		else if (l < lMin)
			lMin = l;
		if (w > wMax)
			wMax = w;
		else if (w < wMin)
			wMin = w;
	}
	rec.x1 = x + lMin * dx;
	rec.y1 = y + lMin * dy;
	rec.x2 = x + lMax * dx;
	rec.y2 = y + lMax * dy;
	rec.width = wMax - wMin;
	rec.x = x;
	rec.y = y;
	rec.theta = theta;
	rec.dx = dx;
	rec.dy = dy;
	rec.prec = prec;
	rec.p = p;
	if (rec.width < 1.0)
		rec.width = 1.0;
}

double Detector::getTheta (const std::vector<RegionPoint>& reg, double x, double y, double regAngle, double prec) const {
	double Ixx = 0.0, Iyy = 0.0, Ixy = 0.0;
	for (const RegionPoint& point : reg) {
		double dx = point.x - x;
		double dy = point.y - y;
		Ixx += dy * dy * point.modgrad;
		Iyy += dx * dx * point.modgrad;
		Ixy -= dx * dy * point.modgrad;
	}
	double lambda = 0.5 * (Ixx + Iyy - std::sqrt((Ixx - Iyy) * (Ixx - Iyy) + 4.0 * Ixy * Ixy));
	double theta = std::fabs(Ixx) > std::fabs(Iyy)
		? double(fastAtan2(float(lambda - Ixx), float(Ixy)))
		: double(fastAtan2(float(Ixy), float(lambda - Iyy)));
	theta *= DEG_TO_RADS;
	if (angleDiff(theta, regAngle) > prec)
		theta += PI;
	return theta;
}

bool Detector::refine (std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec, double densityTh) {
	double density = double(reg.size()) / (dist(rec.x1, rec.y1, rec.x2, rec.y2) * rec.width);
	if (density >= densityTh)
		return true;

	double xc = double(reg[0].x), yc = double(reg[0].y);
	const double angC = reg[0].angle;
	double sum = 0, sSum = 0;
	int n = 0;
	for (RegionPoint& point : reg) {
		used[point.used] = NOTUSED;
		if (dist(xc, yc, point.x, point.y) < rec.width) {
			double angD = angleDiffSigned(point.angle, angC);
			sum += angD;
			sSum += angD * angD;
			++n;
		}
	}
	double meanAngle = sum / double(n);
	double tau = 2.0 * std::sqrt((sSum - 2.0 * meanAngle * sum) / double(n) + meanAngle * meanAngle);

	regionGrow(reg[0].x, reg[0].y, reg, regAngle, tau);
	if (reg.size() < 2)
		return false;
	region2rect(reg, regAngle, prec, p, rec);
	density = double(reg.size()) / (dist(rec.x1, rec.y1, rec.x2, rec.y2) * rec.width);
	if (density < densityTh)
		return reduceRegionRadius(reg, regAngle, prec, p, rec, density, densityTh);
	return true;
}

bool Detector::reduceRegionRadius (std::vector<RegionPoint>& reg, double regAngle, double prec, double p, Rect& rec, double density, double densityTh) {
	double xc = double(reg[0].x), yc = double(reg[0].y);
	double radSq1 = distSq(xc, yc, rec.x1, rec.y1);
	double radSq2 = distSq(xc, yc, rec.x2, rec.y2);
	double radSq = radSq1 > radSq2 ? radSq1 : radSq2;
	while (density < densityTh) {
		radSq *= 0.75 * 0.75;
		for (size_t i = 0; i < reg.size(); ++i) {
			if (distSq(xc, yc, double(reg[i].x), double(reg[i].y)) > radSq) {
				used[reg[i].used] = NOTUSED;
				std::swap(reg[i], reg[reg.size() - 1]);
				reg.pop_back();
				--i;
			}
		}
		if (reg.size() < 2)
			return false;
		region2rect(reg, regAngle, prec, p, rec);
		density = double(reg.size()) / (dist(rec.x1, rec.y1, rec.x2, rec.y2) * rec.width);
	}
	return true;
}

bool Detector::isAligned (int x, int y, double theta, double prec) const {
	if (x < 0 || y < 0 || x >= width || y >= height)
		return false;
	const double a = angles[size_t(y) * width + x];
	if (a == NOTDEF)
		return false;
	double nTheta = theta - a;
	if (nTheta < 0)
		nTheta = -nTheta;
	if (nTheta > M_3_2_PI_) {
		nTheta -= M_2__PI_;
		if (nTheta < 0)
			nTheta = -nTheta;
	}
	return nTheta <= prec;
}

}

std::vector<Segment> detectLineSegments (const Gray8& image) {
	Detector detector;
	return detector.run(image);
}

}
