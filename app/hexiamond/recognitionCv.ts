import {loadOpenCV} from "../opencv";
import {imageTransformForShape, matchRecognitions, matchedPolygon, transformedPlacementCenter, RecognitionContour, RecognitionResult} from "./recognition";
import {Placement, Shape} from "./types";

export interface CvRecognitionOptions {
	threshold?: number;
	minArea?: number;
}

const placementCenter = (placement: Placement, transform: ReturnType<typeof imageTransformForShape>): [number, number] => {
	const center = transformedPlacementCenter(placement, transform);
	return [center.x, center.y];
};

interface ContourMetrics {
	area: number;
	x: number;
	y: number;
}

/** Calculate contour metrics from the portable Mat point buffer.
 * The small vendored OpenCV build omits contourArea and moments.
 */
const contourMetrics = (contour: any): ContourMetrics => {
	const values = contour.data32S as Int32Array;
	const count = Math.floor(values.length / 2);
	if (!count)
		return {area: 0, x: 0, y: 0};
	let twiceArea = 0;
	let centroidX = 0;
	let centroidY = 0;
	for (let index = 0; index < count; index++) {
		const next = (index + 1) % count;
		const x = values[index * 2];
		const y = values[index * 2 + 1];
		const nextX = values[next * 2];
		const nextY = values[next * 2 + 1];
		const cross = x * nextY - nextX * y;
		twiceArea += cross;
		centroidX += (x + nextX) * cross;
		centroidY += (y + nextY) * cross;
	}
	const signedArea = twiceArea / 2;
	if (Math.abs(signedArea) < 0.0001)
		return {area: 0, x: values[0], y: values[1]};
	return {area: Math.abs(signedArea), x: centroidX / (6 * signedArea), y: centroidY / (6 * signedArea)};
};

const contourPolygon = (contour: any): RecognitionContour["polygon"] => {
	const values = contour.data32S as Int32Array;
	const polygon: RecognitionContour["polygon"] = [];
	for (let index = 0; index + 1 < values.length; index += 2)
		polygon.push({x: values[index], y: values[index + 1]});
	return polygon;
};

/** Load the vendored OpenCV runtime and turn dark connected components into board observations. */
export const recognizePhotoCv = async (source: HTMLImageElement | HTMLCanvasElement, shape: Shape, options: CvRecognitionOptions = {}): Promise<RecognitionResult> => {
	const cv = await loadOpenCV("/opencv.min.wasm");
	const image = cv.imread(source);
	const transform = imageTransformForShape(shape, {width: image.cols, height: image.rows});
	const gray = new cv.Mat();
	const binary = new cv.Mat();
	const contours = new cv.MatVector();
	const hierarchy = new cv.Mat();
	try {
		cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
		cv.threshold(gray, binary, options.threshold === undefined ? 170 : options.threshold, 255, cv.THRESH_BINARY_INV);
		cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
		const observations = [];
		const retainedContours: RecognitionContour[] = [];
		for (let index = 0; index < contours.size(); index++) {
			const contour = contours.get(index);
			const metrics = contourMetrics(contour);
			if (metrics.area < (options.minArea || 100)) {
				contour.delete();
				continue;
			}
			const id = `contour-${index}`;
			retainedContours.push({
				id,
				polygon: contourPolygon(contour),
				centroid: {x: metrics.x, y: metrics.y},
			});
			const candidates = shape.placements.flatMap((placements: Placement[]) => placements.map(placement => {
				const center = placementCenter(placement, transform);
				const distance = Math.hypot(center[0] - metrics.x, center[1] - metrics.y);
				return {placement, score: 1 / (1 + distance)};
			})).sort((a, b) => b.score - a.score).slice(0, 8);
			observations.push({id, candidates});
			contour.delete();
		}
		const result = matchRecognitions(shape, observations);
		result.image = {width: image.cols, height: image.rows};
		result.transform = imageTransformForShape(shape, result.image);
		result.matchedPolygons = result.matches.map(match => matchedPolygon(match, result.transform));
		result.contours = retainedContours;
		return result;
	}
	finally {
		image.delete(); gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
	}
};
