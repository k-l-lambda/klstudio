// Canvas 2D renderer for relativistic space flight simulation

import {Game, TransformedStar} from "./Game";
import type {InputState} from "./Game";

export class Renderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private width = 0;
	private height = 0;
	private dpr = 1;
	private rafId = 0;

	constructor (canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
		this.resize();
	}

	resize (): void {
		this.dpr = window.devicePixelRatio || 1;
		const rect = this.canvas.parentElement?.getBoundingClientRect();
		if (!rect) return;

		this.width = rect.width;
		this.height = rect.height;

		this.canvas.width = this.width * this.dpr;
		this.canvas.height = this.height * this.dpr;
		this.canvas.style.width = `${this.width}px`;
		this.canvas.style.height = `${this.height}px`;

		this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
	}

	render (game: Game): void {
		const ctx = this.ctx;
		const w = this.width;
		const h = this.height;

		// Clear to black
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, w, h);

		// Get and draw stars
		const stars = game.getVisibleStars(w, h);
		this.drawStarField(ctx, stars);

		// Draw ship at center
		this.drawShip(ctx, w / 2, h / 2, game.heading);

		// Draw HUD
		this.drawHUD(ctx, game);
	}

	private drawStarField (ctx: CanvasRenderingContext2D, stars: TransformedStar[]): void {
		for (const star of stars) {
			const {screenX, screenY, radius, r, g, b, alpha} = star;

			ctx.globalAlpha = alpha;

			// Glow effect for bright/large stars
			if (radius > 1.8 && alpha > 0.5) {
				const gradient = ctx.createRadialGradient(
					screenX, screenY, 0,
					screenX, screenY, radius * 3,
				);
				gradient.addColorStop(0, `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha * 0.6})`);
				gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(screenX, screenY, radius * 3, 0, Math.PI * 2);
				ctx.fill();
			}

			// Star core
			ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
			ctx.beginPath();
			ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}

	private drawShip (ctx: CanvasRenderingContext2D, cx: number, cy: number, heading: number): void {
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(heading);

		// Ship triangle — pointing right (+x direction)
		const size = 14;
		ctx.beginPath();
		ctx.moveTo(size, 0); // nose
		ctx.lineTo(-size * 0.6, -size * 0.5);
		ctx.lineTo(-size * 0.4, 0);
		ctx.lineTo(-size * 0.6, size * 0.5);
		ctx.closePath();

		// Fill with translucent cyan
		ctx.fillStyle = "rgba(0, 220, 255, 0.7)";
		ctx.fill();

		// Stroke with white
		ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
		ctx.lineWidth = 1.5;
		ctx.stroke();

		ctx.restore();
	}

	private drawHUD (ctx: CanvasRenderingContext2D, game: Game): void {
		const x = this.width - 16;
		const y = 20;
		const lineH = 20;

		ctx.save();
		ctx.font = "13px 'Courier New', monospace";
		ctx.textAlign = "right";
		ctx.fillStyle = "rgba(0, 220, 255, 0.85)";

		ctx.fillText(`v/c  ${game.beta.toFixed(4)}`, x, y);
		ctx.fillText(`φ    ${game.rapidity.toFixed(3)}`, x, y + lineH);
		ctx.fillText(`γ    ${game.gamma.toFixed(3)}`, x, y + lineH * 2);

		// Speed bar
		const barW = 120;
		const barH = 4;
		const barX = x - barW;
		const barY = y + lineH * 3;

		ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
		ctx.fillRect(barX, barY, barW, barH);

		ctx.fillStyle = "rgba(0, 220, 255, 0.7)";
		ctx.fillRect(barX, barY, barW * game.beta, barH);

		ctx.restore();
	}

	startLoop (game: Game, inputState: InputState, onFrame?: () => void): void {
		let lastTime = 0;

		const loop = (time: number) => {
			this.rafId = requestAnimationFrame(loop);

			if (lastTime === 0) {
				lastTime = time;
				return;
			}

			const dt = Math.min((time - lastTime) / 1000, 0.05);
			lastTime = time;

			game.update(dt, inputState);
			this.render(game);

			if (onFrame) onFrame();
		};

		this.rafId = requestAnimationFrame(loop);
	}

	dispose (): void {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
	}
}
