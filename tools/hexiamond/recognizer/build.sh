#!/usr/bin/env bash
# Build the hexiamond recognizer: wasm into public/ (needs emsdk: source ~/emsdk/emsdk_env.sh), or the native CLI.
#   tools/hexiamond/recognizer/build.sh          -> public/hexiamond-recognizer.wasm
#   tools/hexiamond/recognizer/build.sh native   -> /tmp/hexiamond-recognizer
set -euo pipefail
cd "$(dirname "$0")"
SOURCES="api.cpp recognizer.cpp lsd.cpp imgproc.cpp"
# -ffp-contract=off: no fused multiply-add, so float sums round like OpenCV/NumPy and results stay bit-comparable.
FLAGS="-std=c++17 -O3 -ffp-contract=off -fno-exceptions -fno-rtti"
if [ "${1:-}" = "native" ]; then
	g++ $FLAGS -Wall -Wextra $SOURCES native.cpp -o /tmp/hexiamond-recognizer
	echo "built /tmp/hexiamond-recognizer"
	exit 0
fi
OUT=../../../public/hexiamond-recognizer.wasm
em++ $FLAGS -flto $SOURCES -o "$OUT" \
	--no-entry -sSTANDALONE_WASM -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=33554432 -sMAXIMUM_MEMORY=4294967296 \
	-sEXPORTED_FUNCTIONS=_hx_alloc,_hx_free,_hx_recognize,_hx_result_length
echo "built $(realpath "$OUT") ($(stat -c %s "$OUT") bytes)"
