#!/usr/bin/env python3
"""Per-channel line-segment probe for hexiamond board photos.

Normalizes the photo to a fixed long-side resolution, runs OpenCV's LSD
on each of the R, G, B channels separately, keeps segments at least
`--min-length` long (fraction of the long side), and draws them onto a
dimmed copy of the photo, coloured by the channel that found them.

The kept segments of all three channels are then merged, their angles
folded into [0, 180), shifted by +30 and taken modulo 60 (the three edge
directions of a triangular lattice collapse onto one, and an axis-aligned
board lands mid-range instead of straddling 0/60), and plotted as a 1-degree
histogram weighted by length x strength, where strength is the mean edge
contrast across the segment in its own channel (0..1).

Finally the segments within +-2 degrees of the peak (the weighted circular
mean, rounded to 0.1) are drawn again and histogrammed at 0.1-degree bins,
on their true [0, 180) angles: one panel per lattice direction.

From the mode of each panel an affine 2x3 matrix is fitted: its linear part
is the unique (up to scale) map sending the board's 0/60/120-degree lattice
directions onto the three modes, and its scale and translation are fitted
so the transformed triangle lattice lines run through the segments. The std
board (read from app/hexiamond/data.ts) is then drawn through that matrix.

Usage:
	python3 tools/hexiamond/hexiamond-lines.py "footages.local/2026-07-16 23.01.03.jpg"
"""

import argparse
import json
import math
import os

import cv2
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.optimize import minimize

# Added before the modulo so a board with edges near 0/60/120 deg peaks mid-range.
MOD_SHIFT = 30
PEAK_HALF_WIDTH = 2.0
PEAK_STEP = 0.1

DATA_TS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "app", "hexiamond", "data.ts")
LATTICE_HEIGHT = math.sqrt(3) / 2
# Residuals beyond this many px count as outliers in the lattice fit.
FIT_CLIP = 6.0

# BGR draw colours for each source channel (OpenCV channel order is B, G, R).
CHANNELS = [
	("B", 0, (255, 128, 0)),
	("G", 1, (0, 200, 0)),
	("R", 2, (0, 0, 255)),
]


def normalize(image, long_side):
	height, width = image.shape[:2]
	scale = long_side / max(height, width)
	size = (round(width * scale), round(height * scale))
	return cv2.resize(image, size, interpolation=cv2.INTER_AREA), scale


def detect(channel, blur):
	if blur > 0:
		channel = cv2.GaussianBlur(channel, (0, 0), blur)
	lsd = cv2.createLineSegmentDetector(cv2.LSD_REFINE_STD)
	lines = lsd.detect(channel)[0]
	if lines is None:
		return np.zeros((0, 4), np.float32)
	return lines.reshape(-1, 4)


def lengths(lines):
	return np.hypot(lines[:, 2] - lines[:, 0], lines[:, 3] - lines[:, 1])


def strengths(channel, lines, offset=2.0):
	"""Mean |I(+n) - I(-n)| / 255 sampled every pixel along each segment, n = unit normal * offset."""
	channel = channel.astype(np.float32)
	result = np.zeros(len(lines), np.float32)
	for index, (x1, y1, x2, y2) in enumerate(lines):
		length = np.hypot(x2 - x1, y2 - y1)
		steps = max(int(length), 2)
		t = np.linspace(0, 1, steps, dtype=np.float32)
		xs = x1 + (x2 - x1) * t
		ys = y1 + (y2 - y1) * t
		nx, ny = -(y2 - y1) / length * offset, (x2 - x1) / length * offset
		sample = lambda dx, dy: cv2.remap(channel, (xs + dx).reshape(-1, 1), (ys + dy).reshape(-1, 1), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).ravel()
		result[index] = np.abs(sample(nx, ny) - sample(-nx, -ny)).mean() / 255
	return result


def angles(lines):
	"""Segment direction in degrees, folded into [0, 180). Image coordinates: y points down."""
	return np.degrees(np.arctan2(lines[:, 3] - lines[:, 1], lines[:, 2] - lines[:, 0])) % 180


def lattice_angle(folded, weights):
	"""Weighted circular mean on the 60-degree circle."""
	phase = np.radians(folded * 6)
	vector = (weights * np.exp(1j * phase)).sum()
	return (np.degrees(np.angle(vector)) / 6) % 60, abs(vector) / weights.sum()


def plot_histogram(path, title, folded, weights, channels, peak, bins, ticks, xlabel):
	fig, ax = plt.subplots(figsize=(12, 4.5), dpi=120)
	bottom = np.zeros(len(bins) - 1)
	width = bins[1] - bins[0]
	for name, _, color in CHANNELS:
		mask = channels == name
		counts, _ = np.histogram(folded[mask], bins=bins, weights=weights[mask])
		ax.bar(bins[:-1], counts, width=width, align="edge", bottom=bottom, color=np.array(color[::-1]) / 255, edgecolor="none", label=f"{name} ({mask.sum()} segs)")
		bottom += counts
	mean, resultant = peak
	ax.axvline(mean, color="black", linestyle="--", linewidth=1, label=f"circular mean {mean:.2f}° (R={resultant:.2f})")
	ax.set_xlim(bins[0], bins[-1])
	ax.set_xticks(ticks)
	ax.set_xlabel(xlabel)
	ax.set_ylabel("Σ length × strength (px)")
	ax.set_title(title)
	ax.legend()
	ax.grid(axis="y", alpha=0.3)
	fig.tight_layout()
	fig.savefig(path)
	plt.close(fig)
	return bottom


def plot_directions(path, title, panels, weights, channels, half_width, step):
	"""One 0.1-degree histogram panel per lattice direction, on unfolded angles.
	panels: [(center, angle, mask)], angle already unwrapped to center +- 90."""
	fig, axes = plt.subplots(1, len(panels), figsize=(15, 4.5), dpi=120, sharey=True)
	for ax, (center, angle, mask) in zip(axes, panels):
		bins = center - half_width + step * np.arange(round(2 * half_width / step) + 1)
		bottom = np.zeros(len(bins) - 1)
		for name, _, color in CHANNELS:
			select = mask & (channels == name)
			counts, _ = np.histogram(angle[select], bins=bins, weights=weights[select])
			ax.bar(bins[:-1], counts, width=step, align="edge", bottom=bottom, color=np.array(color[::-1]) / 255, edgecolor="none", label=f"{name} ({select.sum()} segs)")
			bottom += counts
		mean = np.average(angle[mask], weights=weights[mask]) if mask.any() else center
		ax.axvline(mean, color="black", linestyle="--", linewidth=1, label=f"weighted mean {mean % 180:.2f}°")
		ax.set_xlim(bins[0], bins[-1])
		ticks = bins[::5]
		ax.set_xticks(ticks)
		ax.set_xticklabels([f"{tick % 180:.1f}" for tick in ticks])
		ax.set_xlabel(f"segment angle (deg, {step:g}° bins)")
		ax.set_title(f"{center % 180:.1f}° ± {half_width:g}°: {mask.sum()} segs, {weights[mask].sum():.0f}")
		ax.legend(fontsize=8)
		ax.grid(axis="y", alpha=0.3)
	axes[0].set_ylabel("Σ length × strength (px)")
	fig.suptitle(title)
	fig.tight_layout()
	fig.savefig(path)
	plt.close(fig)


def load_board(shape_id="std"):
	"""Board triangles in lattice units (side 1, y down), mirroring triangleVertices in geometry.ts."""
	source = open(DATA_TS, encoding="utf-8").read()
	start = source.index('"board": [', source.index(f'"id": "{shape_id}"')) + len('"board": ')
	depth = 0
	for end, char in enumerate(source[start:], start):
		depth += (char == "[") - (char == "]")
		if not depth:
			break
	board = json.loads(source[start:end + 1])
	shear = lambda a, b: (a - b / 2, b * LATTICE_HEIGHT)
	triangles = []
	for y, row in enumerate(board):
		for packed, value in enumerate(row):
			if value > 0:
				x, parity = packed // 2, packed % 2
				triangles.append([shear(x, y), shear(x + parity, y + 1 - parity), shear(x + 1, y + 1)])
	return np.array(triangles, np.float64)


def outline_edges(triangles):
	"""Edges belonging to exactly one triangle."""
	counts = {}
	for triangle in triangles:
		for a, b in zip(triangle, np.roll(triangle, -1, axis=0)):
			key = tuple(sorted((tuple(np.round(a, 6)), tuple(np.round(b, 6)))))
			counts[key] = counts.get(key, 0) + 1
	return np.array([key for key, count in counts.items() if count == 1])


def unit(degrees):
	return np.array([math.cos(math.radians(degrees)), math.sin(math.radians(degrees))])


def linear_from_directions(image_angles):
	"""2x2 L with det 1 sending lattice directions 0/60/120 deg onto the given image angles.
	u2 = u1 - u0, so L u2 ~ e2 forces l1 e1 - l2 e2 = e0 once L u0 = e0, L u1 = l1 e1."""
	e0, e1, e2 = (unit(angle) for angle in image_angles)
	l1, _ = np.linalg.solve(np.column_stack([e1, -e2]), e0)
	basis = np.column_stack([unit(0), unit(60)])
	linear = np.column_stack([e0, l1 * e1]) @ np.linalg.inv(basis)
	det = np.linalg.det(linear)
	if det < 0:
		raise ValueError("directions imply a mirrored board")
	# -L sends every direction to the same line; keep the one that does not turn the board upside down.
	if linear[0, 0] < 0:
		linear = -linear
	return linear / math.sqrt(det)


def describe_linear(linear):
	"""Polar split L = R(rotation) S: rotation plus a symmetric stretch along `axis`."""
	u, sigma, vt = np.linalg.svd(linear)
	rotation = u @ vt
	stretch = vt.T @ np.diag(sigma) @ vt
	axis = math.degrees(math.atan2(vt[0, 1], vt[0, 0])) % 180
	return math.degrees(math.atan2(rotation[1, 0], rotation[0, 0])), sigma[0] / sigma[1], axis, stretch


def apply(matrix, points):
	return points @ matrix[:, :2].T + matrix[:, 2]


def fit_affine(linear, triangles, lines, weights, direction, image_angles):
	"""Scale and translation for x = s L p + t.
	Seeds from the outermost segments per direction, then minimizes the clipped distance
	of every segment midpoint to the nearest image lattice line of its own direction."""
	vertices = triangles.reshape(-1, 2)
	mids = (lines[:, :2] + lines[:, 2:]) / 2
	normals = [unit(angle + 90) for angle in image_angles]

	rows, values = [], []
	for k, normal in enumerate(normals):
		mask = direction == k
		offsets = mids[mask] @ normal
		projected = vertices @ (normal @ linear)
		for board_value, image_value in ((projected.min(), offsets.min()), (projected.max(), offsets.max())):
			rows.append([board_value, *normal])
			values.append(image_value)
	seed = np.linalg.lstsq(np.array(rows), np.array(values), rcond=None)[0]

	# Lattice lines of direction k sit at n_k . p = j h in board space; their image period along N_k is s |N_k L h n_k|.
	gains = [abs(normals[k] @ linear @ (LATTICE_HEIGHT * unit(k * 60 + 90))) for k in range(3)]
	phases0 = [normals[k] @ linear @ np.zeros(2) for k in range(3)]

	def loss(params):
		scale, tx, ty = params
		total = 0.0
		for k, normal in enumerate(normals):
			mask = direction == k
			period = scale * gains[k]
			residual = (mids[mask] @ normal - normal @ np.array([tx, ty]) - phases0[k] + period / 2) % period - period / 2
			total += (weights[mask] * np.minimum(residual ** 2, FIT_CLIP ** 2)).sum()
		return total / weights.sum()

	best = None
	for factor in np.linspace(0.92, 1.04, 13):
		for dx in np.linspace(-6, 6, 7):
			for dy in np.linspace(-6, 6, 7):
				start = [seed[0] * factor, seed[1] + dx, seed[2] + dy]
				value = loss(start)
				if best is None or value < best[0]:
					best = (value, start)
	result = minimize(loss, best[1], method="Nelder-Mead", options={"xatol": 1e-3, "fatol": 1e-6, "maxiter": 4000})
	scale, tx, ty = result.x
	matrix = np.column_stack([scale * linear, [tx, ty]])

	residuals = []
	for k, normal in enumerate(normals):
		mask = direction == k
		period = scale * gains[k]
		residuals.append((mids[mask] @ normal - normal @ np.array([tx, ty]) + period / 2) % period - period / 2)
	residual = np.concatenate(residuals)
	order = np.concatenate([np.flatnonzero(direction == k) for k in range(3)])
	inliers = np.abs(residual) <= FIT_CLIP
	stats = {
		"seed_scale": seed[0],
		"rms": math.sqrt(np.average(np.minimum(residual ** 2, FIT_CLIP ** 2), weights=weights[order])),
		"inlier_weight": weights[order][inliers].sum() / weights.sum(),
		"inlier_rms": math.sqrt(np.average(residual[inliers] ** 2, weights=weights[order][inliers])),
	}
	return matrix, stats


def draw_board(image, matrix, triangles, label):
	canvas = cv2.addWeighted(image, 0.55, np.zeros_like(image), 0.45, 0)
	for triangle in apply(matrix, triangles.reshape(-1, 2)).reshape(-1, 3, 2):
		cv2.polylines(canvas, [np.round(triangle * 16).astype(np.int32)], True, (255, 255, 0), 1, cv2.LINE_AA, shift=4)
	for a, b in apply(matrix, outline_edges(triangles).reshape(-1, 2)).reshape(-1, 2, 2):
		cv2.line(canvas, tuple(np.round(a * 16).astype(int)), tuple(np.round(b * 16).astype(int)), (0, 255, 255), 3, cv2.LINE_AA, shift=4)
	cv2.putText(canvas, label, (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
	return canvas


def draw(canvas, lines, color, thickness):
	for x1, y1, x2, y2 in lines:
		cv2.line(canvas, (round(x1), round(y1)), (round(x2), round(y2)), color, thickness, cv2.LINE_AA)


def dimmed(image):
	gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	return cv2.cvtColor((gray * 0.35).astype(np.uint8), cv2.COLOR_GRAY2BGR)


def main():
	parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	parser.add_argument("image")
	parser.add_argument("--long-side", type=int, default=1024, help="normalized long-side resolution in px")
	parser.add_argument("--min-length", type=float, default=0.03, help="minimum segment length as a fraction of the long side")
	parser.add_argument("--blur", type=float, default=1.0, help="Gaussian sigma before LSD, 0 disables")
	parser.add_argument("--out", default=None, help="output directory (default: <image dir>/lines)")
	args = parser.parse_args()

	source = cv2.imread(args.image)
	if source is None:
		raise SystemExit(f"cannot read {args.image}")
	image, scale = normalize(source, args.long_side)
	min_length = args.min_length * args.long_side
	out_dir = args.out or os.path.join(os.path.dirname(args.image) or ".", "lines")
	os.makedirs(out_dir, exist_ok=True)
	stem = os.path.splitext(os.path.basename(args.image))[0]

	print(f"source {source.shape[1]}x{source.shape[0]} -> {image.shape[1]}x{image.shape[0]} (scale {scale:.4f}), min length {min_length:.1f}px")

	combined = dimmed(image)
	panels = []
	merged, merged_strength, merged_channel = [], [], []
	for name, index, color in CHANNELS:
		lines = detect(image[:, :, index], args.blur)
		kept = lines[lengths(lines) >= min_length]
		strength = strengths(image[:, :, index], kept)
		merged.append(kept)
		merged_strength.append(strength)
		merged_channel += [name] * len(kept)
		print(f"{name}: {len(lines)} segments, {len(kept)} >= threshold, total kept length {lengths(kept).sum():.0f}px, mean strength {strength.mean():.3f}")
		draw(combined, kept, color, 2)

		panel = cv2.cvtColor(image[:, :, index] // 3, cv2.COLOR_GRAY2BGR)
		draw(panel, kept, color, 2)
		cv2.putText(panel, f"{name}: {len(kept)}", (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
		panels.append(panel)

	combined_path = os.path.join(out_dir, f"{stem}.lines.png")
	panels_path = os.path.join(out_dir, f"{stem}.channels.png")
	cv2.imwrite(combined_path, combined)
	cv2.imwrite(panels_path, np.hstack(panels))

	merged = np.vstack(merged)
	merged_strength = np.concatenate(merged_strength)
	merged_channel = np.array(merged_channel)
	weights = lengths(merged) * merged_strength
	folded = (angles(merged) + MOD_SHIFT) % 60
	peak = lattice_angle(folded, weights)
	histogram_path = os.path.join(out_dir, f"{stem}.angle-mod60.png")
	coarse_bins = np.arange(61)
	histogram = plot_histogram(histogram_path, f"{stem}: {len(merged)} segments, (angle + {MOD_SHIFT}) mod 60 weighted by length × strength",
		folded, weights, merged_channel, peak, coarse_bins, range(0, 61, 5), f"(segment angle + {MOD_SHIFT}) mod 60 (deg, 1° bins)")

	top = np.argsort(histogram)[::-1][:6]
	print(f"merged {len(merged)} segments, total weight {weights.sum():.0f}")
	print("top bins: " + ", ".join(f"{b}°:{histogram[b] / histogram.sum():.1%}" for b in top))
	print(f"circular mean {peak[0]:.2f}° (resultant {peak[1]:.3f}); lattice directions {', '.join(f'{(peak[0] - MOD_SHIFT + k * 60) % 180:.2f}°' for k in range(3))}")

	# Fine pass: only segments within +-PEAK_HALF_WIDTH of the peak, 0.1-degree bins.
	center = round(peak[0], 1)
	steps = round(2 * PEAK_HALF_WIDTH / PEAK_STEP)
	fine_bins = center - PEAK_HALF_WIDTH + PEAK_STEP * np.arange(steps + 1)
	offset = (folded - center + 30) % 60 - 30
	window = np.abs(offset) <= PEAK_HALF_WIDTH
	fine_folded = center + offset[window]
	fine_weights = weights[window]
	fine_peak = lattice_angle(fine_folded, fine_weights)

	peak_lines_path = os.path.join(out_dir, f"{stem}.lines-peak.png")
	peak_canvas = dimmed(image)
	for name, _, color in CHANNELS:
		draw(peak_canvas, merged[window & (merged_channel == name)], color, 2)
	cv2.putText(peak_canvas, f"{window.sum()} segs within {center:.1f} +- {PEAK_HALF_WIDTH:g} deg", (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)
	cv2.imwrite(peak_lines_path, peak_canvas)

	fine_path = os.path.join(out_dir, f"{stem}.angle-peak.png")
	raw = angles(merged)
	direction = np.round((raw - (center - MOD_SHIFT)) / 60) % 3
	panels = []
	for k in range(3):
		axis = (center - MOD_SHIFT + k * 60) % 180
		unwrapped = axis + (raw - axis + 90) % 180 - 90
		mask = window & (direction == k)
		panels.append((axis, unwrapped, mask))
		print(f"direction {axis:.1f}°: {mask.sum()} segs, {weights[mask].sum() / weights[window].sum():.1%} of window weight, weighted mean {np.average(unwrapped[mask], weights=weights[mask]) % 180:.2f}°")
	modes = []
	for axis, unwrapped, mask in panels:
		bins = axis - PEAK_HALF_WIDTH + PEAK_STEP * np.arange(round(2 * PEAK_HALF_WIDTH / PEAK_STEP) + 1)
		counts, _ = np.histogram(unwrapped[mask], bins=bins, weights=weights[mask])
		modes.append(bins[np.argmax(counts)] + PEAK_STEP / 2)
	print("modes: " + ", ".join(f"{mode % 180:.2f}°" for mode in modes) + f"; 60→120 spread {modes[2] - modes[1]:.2f}°")

	triangles = load_board()
	linear = linear_from_directions(modes)
	rotation, anisotropy, stretch_axis, _ = describe_linear(linear)
	fit_mask = window
	matrix, stats = fit_affine(linear, triangles, merged[fit_mask], weights[fit_mask], direction[fit_mask].astype(int), modes)
	print(f"linear part (det 1): rotation {rotation:.2f}°, stretch {anisotropy:.4f} along {stretch_axis:.1f}°")
	print(f"scale {np.sqrt(np.linalg.det(matrix[:, :2])):.2f} px per lattice edge (seed {stats['seed_scale']:.2f}); clipped rms {stats['rms']:.2f}px, "
		f"inliers (<= {FIT_CLIP:g}px) {stats['inlier_weight']:.1%} of weight, inlier rms {stats['inlier_rms']:.2f}px")
	print("affine 2x3 (normalized px <- lattice units):\n" + "\n".join("\t[" + ", ".join(f"{value:10.4f}" for value in row) + "]" for row in matrix))
	source_matrix = matrix / scale
	print("affine 2x3 (source px <- lattice units):\n" + "\n".join("\t[" + ", ".join(f"{value:10.4f}" for value in row) + "]" for row in source_matrix))
	board_path = os.path.join(out_dir, f"{stem}.board-fit.png")
	cv2.imwrite(board_path, draw_board(image, matrix, triangles, f"modes {', '.join(f'{mode % 180:.2f}' for mode in modes)} | rot {rotation:.2f} stretch {anisotropy:.3f}@{stretch_axis:.0f}"))
	print(f"wrote {board_path}")

	plot_directions(fine_path, f"{stem}: {window.sum()} segments within ± {PEAK_HALF_WIDTH:g}° of each lattice direction (unfolded)",
		panels, weights, merged_channel, PEAK_HALF_WIDTH, PEAK_STEP)
	print(f"peak window ±{PEAK_HALF_WIDTH:g}° around {center:.1f}° (mod 60): {window.sum()}/{len(merged)} segments, {fine_weights.sum() / weights.sum():.1%} of weight; folded circular mean {fine_peak[0]:.3f}° (resultant {fine_peak[1]:.4f})")
	print(f"wrote {combined_path}\nwrote {panels_path}\nwrote {histogram_path}\nwrote {peak_lines_path}\nwrote {fine_path}")


if __name__ == "__main__":
	main()
