// Space flight simulation — core game engine (3D star field, 2D ship movement)
// Supports Einstein mode (special relativity) and Galilean mode (classical physics)

export interface InputState {
	accelerate: boolean;
	decelerate: boolean;
	steerLeft: boolean;
	steerRight: boolean;
}

export interface Star {
	x: number;
	y: number;
	z: number;
	baseRadius: number;
	baseColor: [number, number, number]; // RGB 0–255
}

export interface TransformedStar {
	x: number;
	y: number;
	z: number;
	radius: number;
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export type PhysicsMode = "galilean" | "einstein";

// Speed of light in game units/s
export const C = 1000;

// Rapidity rate: arctanh(0.9) / 5 ≈ 0.2944/s — reach 0.9c in 5 seconds
const RAPIDITY_RATE = Math.atanh(0.9) / 5;

// Galilean acceleration matches rapidity rate at low speed
const GALILEAN_ACCEL = C * RAPIDITY_RATE;

// Maximum speed in Galilean mode (5c)
const GALILEAN_MAX_SPEED = C * 5;

// Steering rate in radians/s
const STEER_RATE = 2.0;

// Star field grid
const CELL_SIZE = 2000;
const STARS_PER_CELL = 15;
const Z_RANGE = 1000;

// Maximum rapidity (prevents numerical issues at extreme γ)
const MAX_RAPIDITY = 6.0; // tanh(6) ≈ 0.99999

// Base star colors — a palette of spectral types
const STAR_COLORS: [number, number, number][] = [
	[155, 176, 255], // O — blue
	[170, 191, 255], // B — blue-white
	[202, 215, 255], // A — white
	[248, 247, 255], // F — yellow-white
	[255, 244, 234], // G — yellow (Sun-like)
	[255, 210, 161], // K — orange
	[255, 204, 111], // M — red-orange
];


/**
 * Simple seeded PRNG (xorshift-based).
 */
function seedRandom (seed: number): () => number {
	let s = seed | 0;
	if (s === 0) s = 1;
	return () => {
		s ^= s << 13;
		s ^= s >> 17;
		s ^= s << 5;
		return ((s >>> 0) / 4294967296);
	};
}


/**
 * Hash two cell coordinates into a seed.
 */
function cellSeed (cx: number, cy: number): number {
	return ((cx * 73856093) ^ (cy * 19349663)) | 0;
}


/**
 * Generate stars for a given cell.
 */
function generateCell (cx: number, cy: number): Star[] {
	const rng = seedRandom(cellSeed(cx, cy));
	const originX = cx * CELL_SIZE;
	const originY = cy * CELL_SIZE;
	const stars: Star[] = [];

	for (let i = 0; i < STARS_PER_CELL; i++) {
		stars.push({
			x: originX + rng() * CELL_SIZE,
			y: originY + rng() * CELL_SIZE,
			z: (rng() - 0.5) * 2 * Z_RANGE,
			baseRadius: 1.2 + rng() * 3.0, // 1.2–4.2
			baseColor: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
		});
	}

	return stars;
}


/**
 * Apply Doppler wavelength shift to an RGB color.
 * D > 1 → blueshift, D < 1 → redshift.
 * Uses a simplified mapping: shift the color temperature.
 */
function dopplerShiftColor (
	r: number, g: number, b: number, D: number,
): [number, number, number] {
	// Simplified Doppler color: interpolate toward blue (D>1) or red (D<1)
	if (D > 1) {
		// Blueshift: mix toward blue-white
		const t = Math.min((D - 1) / 2, 1);
		return [
			r + (155 - r) * t,
			g + (176 - g) * t,
			b + (255 - b) * t,
		];
	}
	else {
		// Redshift: mix toward deep red
		const t = Math.min((1 - D) / 1.5, 1);
		return [
			r + (255 - r) * t,
			g + (80 - g) * t,
			b + (0 - b) * t,
		];
	}
}


export class Game {
	// Ship state
	shipX = 0;
	shipY = 0;
	heading = 0; // radians, 0 = right (+x)
	rapidity = 0; // φ = arctanh(v/c) — Einstein mode
	speed = 0; // raw velocity in game units/s — Galilean mode

	// Physics mode
	mode: PhysicsMode = "galilean";

	// Star field cache
	private cellCache = new Map<string, Star[]>();

	// Derived quantities (updated each frame)
	beta = 0; // v/c = tanh(φ)
	gamma = 1; // Lorentz factor = cosh(φ)
	velocity = 0; // game units/s

	get speedFraction (): number {
		return this.beta;
	}

	setMode (newMode: PhysicsMode): void {
		if (newMode === this.mode) return;

		if (newMode === "einstein") {
			// Convert Galilean speed to rapidity; clamp to < c
			const clampedBeta = Math.min(this.speed / C, Math.tanh(MAX_RAPIDITY));
			this.rapidity = Math.atanh(clampedBeta);
		}
		else {
			// Convert rapidity to raw speed
			this.speed = this.velocity;
		}

		this.mode = newMode;
	}

	update (dt: number, input: InputState): void {
		// Cap dt to avoid spiral of death
		if (dt > 0.05) dt = 0.05;

		// Steering (same for both modes)
		if (input.steerLeft) {
			this.heading -= STEER_RATE * dt;
		}
		if (input.steerRight) {
			this.heading += STEER_RATE * dt;
		}

		// Normalize heading
		this.heading = ((this.heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

		if (this.mode === "einstein") {
			// Update rapidity
			if (input.accelerate) {
				this.rapidity = Math.min(MAX_RAPIDITY, this.rapidity + RAPIDITY_RATE * dt);
			}
			else if (input.decelerate) {
				this.rapidity = Math.max(0, this.rapidity - RAPIDITY_RATE * dt);
			}

			// Derive velocity quantities
			this.beta = Math.tanh(this.rapidity);
			this.gamma = Math.cosh(this.rapidity);
			this.velocity = C * this.beta;
		}
		else {
			// Galilean: direct speed manipulation
			if (input.accelerate) {
				this.speed = Math.min(GALILEAN_MAX_SPEED, this.speed + GALILEAN_ACCEL * dt);
			}
			else if (input.decelerate) {
				this.speed = Math.max(0, this.speed - GALILEAN_ACCEL * dt);
			}

			this.velocity = this.speed;
			this.beta = this.speed / C;
			this.gamma = 1;
		}

		// Move ship in rest frame
		this.shipX += this.velocity * Math.cos(this.heading) * dt;
		this.shipY += this.velocity * Math.sin(this.heading) * dt;
	}

	getVisibleStars (viewW: number, viewH: number): TransformedStar[] {
		// Generous spherical cull radius — GPU handles frustum clipping
		const viewRadius = Math.sqrt(viewW * viewW + viewH * viewH) / 2;
		const buffer = this.mode === "einstein" ? this.gamma * 1.5 : 1.5;
		const range = viewRadius * buffer + CELL_SIZE;

		// Determine which cells to load (cells are 2D — ship moves in x-y only)
		const minCX = Math.floor((this.shipX - range) / CELL_SIZE);
		const maxCX = Math.floor((this.shipX + range) / CELL_SIZE);
		const minCY = Math.floor((this.shipY - range) / CELL_SIZE);
		const maxCY = Math.floor((this.shipY + range) / CELL_SIZE);

		// Load/generate needed cells
		const neededKeys = new Set<string>();
		for (let cx = minCX; cx <= maxCX; cx++) {
			for (let cy = minCY; cy <= maxCY; cy++) {
				const key = `${cx},${cy}`;
				neededKeys.add(key);
				if (!this.cellCache.has(key)) {
					this.cellCache.set(key, generateCell(cx, cy));
				}
			}
		}

		// Evict distant cells
		if (this.cellCache.size > neededKeys.size * 2) {
			for (const key of this.cellCache.keys()) {
				if (!neededKeys.has(key)) {
					this.cellCache.delete(key);
				}
			}
		}

		// Spherical cull radius for 3D
		const cullRadiusSq = (range + Z_RANGE) * (range + Z_RANGE);

		if (this.mode === "galilean") {
			return this.getVisibleStarsGalilean(cullRadiusSq);
		}

		return this.getVisibleStarsEinstein(cullRadiusSq);
	}

	private getVisibleStarsGalilean (cullRadiusSq: number): TransformedStar[] {
		const result: TransformedStar[] = [];

		for (const stars of this.cellCache.values()) {
			for (const star of stars) {
				const dx = star.x - this.shipX;
				const dy = star.y - this.shipY;
				const dz = star.z; // ship at z=0

				// Spherical culling
				if (dx * dx + dy * dy + dz * dz > cullRadiusSq) continue;

				result.push({
					x: dx,
					y: dy,
					z: dz,
					radius: star.baseRadius,
					r: star.baseColor[0],
					g: star.baseColor[1],
					b: star.baseColor[2],
					alpha: 1,
				});
			}
		}

		return result;
	}

	private getVisibleStarsEinstein (cullRadiusSq: number): TransformedStar[] {
		// Velocity direction (in x-y plane)
		const vDirX = Math.cos(this.heading);
		const vDirY = Math.sin(this.heading);
		// In-plane perpendicular direction (90° counterclockwise)
		const pDirX = -vDirY;
		const pDirY = vDirX;

		const beta = this.beta;
		const gamma = this.gamma;
		const isMoving = beta > 1e-6;

		const result: TransformedStar[] = [];

		for (const stars of this.cellCache.values()) {
			for (const star of stars) {
				// Rest-frame displacement from ship
				const dx = star.x - this.shipX;
				const dy = star.y - this.shipY;
				const dz = star.z; // ship at z=0

				let outX: number;
				let outY: number;
				let outZ: number;
				let D = 1; // Doppler factor
				let intensity = 1;

				if (isMoving) {
					// Decompose into parallel (along heading in x-y) and perpendicular
					const dPar = dx * vDirX + dy * vDirY;
					const dPerpXY = dx * pDirX + dy * pDirY; // in-plane perpendicular
					// dz is already the z-perpendicular component

					// Lorentz contraction along velocity direction
					const dParContracted = dPar / gamma;

					// 3D distance after contraction
					const dist = Math.sqrt(dParContracted * dParContracted + dPerpXY * dPerpXY + dz * dz);
					if (dist < 1) continue; // Skip if star is essentially at ship

					const cosAlpha = dParContracted / dist;
					const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

					// Relativistic aberration
					const cosAlphaPrime = (cosAlpha - beta) / (1 - beta * cosAlpha);
					const sinAlphaPrime = Math.sqrt(Math.max(0, 1 - cosAlphaPrime * cosAlphaPrime));

					// Scale perpendicular components uniformly to preserve their direction
					// The perpendicular plane has two components: dPerpXY and dz
					let newDPerpXY: number;
					let newDZ: number;
					if (sinAlpha > 1e-10) {
						const perpScale = sinAlphaPrime / sinAlpha;
						newDPerpXY = dPerpXY * perpScale;
						newDZ = dz * perpScale;
					}
					else {
						newDPerpXY = dPerpXY;
						newDZ = dz;
					}

					// Reconstruct 3D position from aberrated angle
					const newDPar = cosAlphaPrime * dist;

					// Convert back to world-relative coordinates
					outX = newDPar * vDirX + newDPerpXY * pDirX;
					outY = newDPar * vDirY + newDPerpXY * pDirY;
					outZ = newDZ;

					// Doppler factor
					D = 1 / (gamma * (1 - beta * cosAlpha));

					// Relativistic beaming: intensity ∝ D³
					intensity = D * D * D;
				}
				else {
					outX = dx;
					outY = dy;
					outZ = dz;
				}

				// Spherical culling
				if (outX * outX + outY * outY + outZ * outZ > cullRadiusSq) continue;

				// Apply Doppler color shift
				const [sr, sg, sb] = dopplerShiftColor(
					star.baseColor[0], star.baseColor[1], star.baseColor[2], D,
				);

				// Intensity-scaled alpha and radius
				const alpha = Math.min(1, Math.max(0.05, intensity));
				const radius = star.baseRadius * Math.max(0.3, Math.min(3, Math.sqrt(intensity)));

				result.push({
					x: outX,
					y: outY,
					z: outZ,
					radius,
					r: Math.min(255, sr * Math.max(1, intensity * 0.5)),
					g: Math.min(255, sg * Math.max(1, intensity * 0.5)),
					b: Math.min(255, sb * Math.max(1, intensity * 0.5)),
					alpha,
				});
			}
		}

		return result;
	}
}
