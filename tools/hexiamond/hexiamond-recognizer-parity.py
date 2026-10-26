#!/usr/bin/env python3
"""Parity check: tools/hexiamond/recognizer (C++/wasm) against app/hexiamond/photo-recognition.ipynb.

For each photo the notebook's code runs as-is (figures discarded) and the C++ recognizer runs on the same
decoded pixels (cv2.imread, BGR), either as the native CLI or as the wasm module under node. Stages are
compared: segment count, peak, modes, board pose (max vertex deviation in px), edge confidences, cuts,
final regions and blanks, and (wasm) the saved-board placements. Status OK = every stage matches; SAME = same
regions and placements but a different pose path; DIFF = a different result (exit code 1).

Usage:
	python3 tools/hexiamond/hexiamond-recognizer-parity.py [--engine native|wasm] [--binary PATH] image.jpg ...
"""

import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import cv2
import nbformat
import numpy as np

REPO = Path(__file__).resolve().parents[2]
NOTEBOOK = REPO / "app" / "hexiamond" / "photo-recognition.ipynb"


def notebook_code():
	notebook = nbformat.read(NOTEBOOK, 4)
	source = "\n\n".join(cell.source for cell in notebook.cells if cell.cell_type == "code")
	source = source.replace("plt.show()", "plt.close('all')")
	# The export cell writes a .board.json next to the photo; keep the check side-effect free.
	return source.replace("out_path.write_text(board_json + \"\\n\")", "pass")


def run_notebook(code, image_path):
	scope = {"__name__": "__notebook__"}
	code = code.replace('IMAGE_PATH = REPO / "footages.local" / "2026-07-16 23.01.03.jpg"', f"IMAGE_PATH = Path({str(image_path)!r})")
	cwd = os.getcwd()
	os.chdir(REPO / "app" / "hexiamond")
	stdout = sys.stdout
	try:
		sys.stdout = open(os.devnull, "w")
		started = time.perf_counter()
		exec(compile(code, str(NOTEBOOK), "exec"), scope)
		scope["_seconds"] = time.perf_counter() - started
	finally:
		sys.stdout.close()
		sys.stdout = stdout
		os.chdir(cwd)
	return scope


def board_rows(scope):
	return ";".join(",".join(str(v) for v in row) for row in scope["shape"]["board"])


def run_engine(engine, binary, image, scope):
	height, width = image.shape[:2]
	with tempfile.NamedTemporaryFile(suffix=".raw", delete=False) as handle:
		handle.write(np.ascontiguousarray(image).tobytes())
		raw = handle.name
	try:
		rows = board_rows(scope)
		if engine == "native":
			command = [binary, raw, str(width), str(height), "3", "1", rows]
		else:
			command = ["npx", "ts-node", "--project", str(REPO / "tsconfig.node.json"), str(REPO / "tools" / "hexiamond" / "hexiamond-recognizer-run.ts"), binary, raw, str(width), str(height), "3", "1", scope["SHAPE_ID"]]
		started = time.perf_counter()
		output = subprocess.run(command, check=True, capture_output=True, text=True, cwd=REPO).stdout
		seconds = time.perf_counter() - started
	finally:
		os.unlink(raw)
	return json.loads(output), seconds


def partition(labels, blank):
	groups = {}
	for cell, label in enumerate(labels):
		groups.setdefault(int(label), set()).add(cell)
	return {frozenset(cells): bool(all(blank[c] for c in cells)) for cells in groups.values()}


def compare(scope, result):
	report = {}
	report["segments"] = (len(scope["segments"]), result["segments"])
	report["peak"] = abs(float(scope["peak"]) - result["peak"])
	report["modes"] = max(abs(float(a) - b) for a, b in zip(scope["modes"], result["modes"]))
	vertices = scope["vertices"]
	expected_H = scope["H"]
	actual_H = np.array(result["H"]).reshape(3, 3)
	report["pose_px"] = float(np.abs(scope["to_image"](expected_H, vertices) - scope["to_image"](actual_H, vertices)).max())
	report["confidence"] = float(np.abs(np.array(scope["confidence"]) - np.array([e[2] for e in result["edges"]])).max())
	expected_cut = np.array(scope["final_cut"], bool)
	actual_cut = np.array([bool(e[3]) for e in result["edges"]])
	report["cut_diff"] = int((expected_cut != actual_cut).sum())
	expected = partition(scope["final_labels"], scope["blank_cells"])
	actual_labels = np.zeros(len(vertices) // 3, int)
	actual_blank = np.zeros(len(vertices) // 3, bool)
	for index, region in enumerate(result["regions"]):
		for cell in region["cells"]:
			actual_labels[cell] = index
			actual_blank[cell] = region["blank"]
	actual = partition(actual_labels, actual_blank)
	report["regions_equal"] = expected == actual
	report["blocks"] = (sum(1 for b in expected.values() if not b), sum(1 for b in actual.values() if not b))
	if "placements" in result:
		# The wrapper's placement mapping against the notebook's saved board (order-free).
		key = lambda entry: (entry["blockId"], entry["orientationId"], tuple(entry["translation"]))
		report["placements_equal"] = sorted(map(key, scope["saved"])) == sorted(map(key, result["placements"]))
	return report


def main():
	parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	parser.add_argument("images", nargs="+")
	parser.add_argument("--engine", choices=("native", "wasm"), default="native")
	parser.add_argument("--binary", help="native CLI or .wasm path")
	args = parser.parse_args()
	binary = args.binary or (str(REPO / "public" / "hexiamond-recognizer.wasm") if args.engine == "wasm" else "/tmp/hexiamond-recognizer")
	code = notebook_code()
	failures = 0
	for path in args.images:
		image = cv2.imread(path)
		scope = run_notebook(code, Path(path).resolve())
		result, seconds = run_engine(args.engine, binary, image, scope)
		report = compare(scope, result)
		same = report["regions_equal"] and report.get("placements_equal", True)
		strict = same and report["cut_diff"] == 0 and report["pose_px"] < 1.0
		# OK: every stage matches. SAME: identical regions/placements, but the pose search took a different path
		# (the coarse descent and Powell amplify last-bit libm differences, e.g. musl in wasm vs glibc in NumPy).
		status = "OK  " if strict else ("SAME" if same else "DIFF")
		failures += not same
		print(f"{status} {Path(path).name}: segments {report['segments'][0]}/{report['segments'][1]}, peak Δ{report['peak']:.2g}, modes Δ{report['modes']:.2g}°, "
			f"pose Δ{report['pose_px']:.3f}px, confidence Δ{report['confidence']:.3g}, cut diff {report['cut_diff']}, regions {'equal' if report['regions_equal'] else 'DIFFER'}, "
			f"blocks {report['blocks'][0]}/{report['blocks'][1]}" + (f", placements {'equal' if report['placements_equal'] else 'DIFFER'}" if "placements_equal" in report else "") + f" | notebook {scope['_seconds']:.1f}s, {args.engine} {seconds * 1000:.0f}ms (in-module {sum(result['timing'].values()):.0f}ms: "
			+ ", ".join(f"{k} {v:.0f}" for k, v in result["timing"].items()) + ")")
	sys.exit(1 if failures else 0)


if __name__ == "__main__":
	main()
