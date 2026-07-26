
import * as THREE from "three";



/**
 * Curved-space (S^3) rendering by flat perspective projection with an adjusted
 * world transform per object.
 *
 * We render S^3 with an ordinary pinhole camera at the origin, but bake all of
 * the curvature into each object's world matrix. Intra-mesh bending is ignored
 * (triangles are not warped along their own geodesics); only the object's
 * *center* is transported through the hypersphere.
 *
 * Light from an object reaches the eye along the great circle joining them,
 * travelling BOTH ways. So every object yields two images:
 *
 *   - a NEAR image along the short arc, and
 *   - a FAR image along the long arc (2*pi*R - shortArc), which — because the
 *     tangential magnification factor changes sign across the antipode — shows
 *     the object's INNER surface (rendered with THREE.BackSide), giant and
 *     flipped, arriving from the opposite direction.
 *
 * For an object at geodesic angle theta = arc / R on the unit sphere of angular
 * radius pi (antipode at theta = pi), an object of intrinsic size s subtends an
 * apparent angular size proportional to s / sin(theta). We realize that with a
 * flat camera by placing the mesh at render distance rho = theta and applying a
 * tangential scale of theta / sin(theta); then
 *
 *     apparentSize = tangentialScale / rho = 1 / sin(theta),
 *
 * which is exactly the S^3 law. Radial scale stays 1 (depth is not magnified).
 */



/** Smallest |sin(theta)| we allow, so apparent size stays finite at the poles/antipode. */
const SIN_FLOOR = 1e-3;


export interface ImageProjection {
	/** Short-arc geodesic angle in radians, theta in (0, pi]. */
	shortAngle: number;
	/** Render angle used for THIS image: theta (near) or 2*pi - theta (far), i.e. the arc actually travelled, in radians. */
	renderAngle: number;
	/** Distance from the camera at which the flat mesh is placed (render units == radians). */
	renderDistance: number;
	/** Isotropic-in-tangent-plane magnification (radial scale is always 1). */
	tangentialScale: number;
	/** Apparent angular size factor, tangentialScale / renderDistance == 1 / sin(theta). */
	apparentSize: number;
	/** True for the long-arc image (inner surface, arrives from -dir). */
	far: boolean;
}


/**
 * Pure numeric projection of one object image. No THREE dependency, so it is
 * cheaply unit-testable.
 *
 * @param arcDistance geodesic arc length travelled from the eye, in world units.
 * @param radius      S^3 radius R (circumference 2*pi*R, antipode at pi*R).
 * @param far         when true, compute the long-arc (inner-surface) image.
 */
export const imageProjection = (arcDistance: number, radius: number, far: boolean): ImageProjection => {
	// Fold the travelled arc into an angle in [0, 2*pi), then take the short arc.
	const theta = ((arcDistance / radius) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
	const shortAngle = theta <= Math.PI ? theta : 2 * Math.PI - theta;

	const renderAngle = far ? 2 * Math.PI - shortAngle : shortAngle;
	// sin(2*pi - a) == -sin(a); magnitude is identical for near and far, so both
	// images always share the same apparent size — they merge at the antipode.
	const sinMag = Math.max(Math.abs(Math.sin(shortAngle)), SIN_FLOOR);

	const renderDistance = renderAngle;
	const tangentialScale = renderAngle / sinMag;
	const apparentSize = tangentialScale / renderDistance; // == 1 / sinMag

	return {shortAngle, renderAngle, renderDistance, tangentialScale, apparentSize, far};
};


const _z = new THREE.Vector3(0, 0, 1);
const _frame = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _pos = new THREE.Vector3();


/**
 * Build the world matrix for one object image, for a normal PerspectiveCamera at
 * the origin.
 *
 * Composition (applied right-to-left to the mesh):
 *   T(renderDistance * dir) . Frame(dir) . diag(tan, tan, 1) . Frame(dir)^-1 . orientation
 *
 * The anisotropic scale is expressed in a frame whose local +z is aligned with
 * `dir`, so the radial axis (z) keeps scale 1 while the two tangential axes are
 * magnified. `orientation` is the object's own rigid spin; it is left-multiplied
 * by the frame rotation so the object turns coherently as it moves along the
 * geodesic (a first-order parallel-transport stand-in).
 *
 * @param arcDistance geodesic arc from the eye, world units.
 * @param radius      S^3 radius R.
 * @param dir         unit direction to the object in camera space (near image);
 *                    pass the negated direction for the far image.
 * @param orientation object's rigid world orientation.
 * @param far         long-arc image when true: point-inverted (upside-down),
 *                    depth-reversed, rendered BackSide (det < 0).
 * @param target      optional Matrix4 to write into.
 * @param distanceScale global multiplier on render distance only (frames the
 *                    scene; leaves the tangential magnification, hence the
 *                    apparent-size law, unchanged in shape — it merely rescales
 *                    the whole embedding so objects fit the flat frustum).
 */
export const buildImageMatrix = (
	arcDistance: number,
	radius: number,
	dir: THREE.Vector3,
	orientation: THREE.Quaternion,
	far: boolean,
	target: THREE.Matrix4 = new THREE.Matrix4(),
	distanceScale = 1,
): {matrix: THREE.Matrix4; projection: ImageProjection} => {
	const projection = imageProjection(arcDistance, radius, far);

	const unit = _pos.copy(dir).normalize();
	// Rotation carrying local +z onto the view direction.
	_frame.setFromUnitVectors(_z, unit);

	// Anisotropic scale in the direction-aligned frame: tangential (x, y), radial (z).
	// The NEAR image is an upright, orientation-preserving picture: diag(s, s, 1).
	// The FAR image is formed by antipodal light re-converging through the focus,
	// so its linear map is the near scale composed with a point inversion (-I) =
	// diag(-s, -s, -1). That -I is simultaneously a 180 deg rotation about the line
	// of sight (the object appears UPSIDE-DOWN when you turn to face it) and a depth
	// reversal. det < 0, so the far mesh is rendered with THREE.BackSide to keep its
	// outer surface facing the viewer.
	const s = projection.tangentialScale;
	const tangential = far ? -s : s;
	const radial = far ? -1 : 1;
	_scale.set(tangential, tangential, radial);

	const scaleMatrix = new THREE.Matrix4().makeScale(_scale.x, _scale.y, _scale.z);
	const frameMatrix = new THREE.Matrix4().makeRotationFromQuaternion(_frame);
	const frameInv = new THREE.Matrix4().makeRotationFromQuaternion(_frame.clone().invert());
	const orientMatrix = new THREE.Matrix4().makeRotationFromQuaternion(orientation);

	// M = Frame . S . Frame^-1 . orientation
	target.copy(frameMatrix).multiply(scaleMatrix).multiply(frameInv).multiply(orientMatrix);

	// Prepend the translation to (renderDistance * distanceScale) * dir. Scaling
	// distance alone is a uniform zoom-out: angular size stays proportional to
	// 1/sin(theta), so the shrink->loom trajectory is preserved in shape.
	target.setPosition(unit.multiplyScalar(projection.renderDistance * distanceScale));

	return {matrix: target, projection};
};
