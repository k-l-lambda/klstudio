/* Render 12 SVG graphs (one per hexiamond block) into a single HTML file. Each graph overlays
 * every legal placement of that block on the standard board as a frame line, with opacity and line
 * weight proportional to how often that position occurs across all 5,885 solutions. More frequent
 * positions are drawn on top (later in z-order) so hot spots stay visible.
 *
 * Run: npx ts-node --project ./tsconfig.node.json tools/hexiamond-std-frequency-html.ts
 * Reads:  static/hexiamond-std-frequency.json
 * Writes: public/hexiamond/std-frequency.html (served by Express from docs/ at /hexiamond/std-frequency.html)
 */
import {readFileSync, writeFileSync, mkdirSync} from "fs";
import {resolve, dirname} from "path";
import {buildShape, outlinePath, viewBoxForPoints, triangleVertices} from "../app/hexiamond/geometry";
import {PackedPoint} from "../app/hexiamond/types";

interface FreqPlacement {
	orientationId: number;
	translation: [number, number];
	indices: number[];
	points: PackedPoint[];
	count: number;
}
interface FreqBlock {id: number; name: string; color: string; placements: FreqPlacement[];}
interface FreqData {shape: string; cellCount: number; solutions: number; boardPoints: PackedPoint[]; blocks: FreqBlock[];}

const data: FreqData = JSON.parse(readFileSync(resolve(__dirname, "../static/hexiamond-std-frequency.json"), "utf8"));
const shape = buildShape(data.shape);
const viewBox = viewBoxForPoints(shape.boardPoints);

// Faint grey outline of the whole board, plus per-cell triangles as a background grid.
const boardOutline = outlinePath(shape.boardPoints);
const cellTriangles = shape.boardPoints
	.map(point => `<polygon points="${triangleVertices(point).map(v => v.map(n => n.toFixed(2)).join(",")).join(" ")}" />`)
	.join("");

// Each placement is drawn as a frame LINE (outline only). Opacity and line weight scale with how
// often the position occurs; rare positions stay faintly visible, the hottest reach full strength.
const OPACITY_FLOOR = 0.06;
const OPACITY_CEIL = 0.94;
const WIDTH_MIN = 0.6;
const WIDTH_MAX = 2.4;

const graphFor = (block: FreqBlock): string => {
	const used = block.placements.filter(placement => placement.count > 0);
	const max = used.reduce((best, placement) => Math.max(best, placement.count), 1);
	// Ascending by count => most frequent stroked last => frame line sits on top.
	const ordered = used.slice().sort((a, b) => a.count - b.count);
	const frames = ordered
		.map(placement => {
			const t = placement.count / max;
			const opacity = OPACITY_FLOOR + (OPACITY_CEIL - OPACITY_FLOOR) * t;
			const width = WIDTH_MIN + (WIDTH_MAX - WIDTH_MIN) * t;
			const path = outlinePath(placement.points);
			return `<path d="${path}" fill="none" stroke="${block.color}" stroke-opacity="${opacity.toFixed(3)}" stroke-width="${width.toFixed(2)}" />`;
		})
		.join("");
	const total = used.reduce((sum, placement) => sum + placement.count, 0);
	return `<figure class="card">
	<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${block.name} placement frequency">
		<g class="grid"><path d="${boardOutline}" class="board-outline" />${cellTriangles}</g>
		<g class="frames">${frames}</g>
	</svg>
	<figcaption>
		<span class="swatch" style="background:${block.color}"></span>
		<span class="name">${block.id}. ${block.name}</span>
		<span class="meta">${used.length} positions · hottest ${max.toLocaleString()}× · Σ ${total.toLocaleString()}</span>
	</figcaption>
</figure>`;
};

const cards = data.blocks.map(graphFor).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hexiamond — Standard board placement frequency</title>
<style>
	:root { color-scheme: light dark; --bg: #0f1115; --panel: #171a21; --ink: #e7e9ee; --muted: #9aa3b2; --line: #2a2f3a; }
	* { box-sizing: border-box; }
	body { margin: 0; padding: 32px; background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif; }
	header { max-width: 1200px; margin: 0 auto 28px; }
	h1 { font-size: 22px; margin: 0 0 6px; }
	header p { margin: 0; color: var(--muted); }
	header p strong { color: var(--ink); }
	.grid-wrap { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
	.card { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
	.card svg { width: 100%; height: auto; display: block; }
	.grid polygon { fill: none; stroke: var(--line); stroke-width: 0.5; }
	.board-outline { fill: none; stroke: var(--muted); stroke-width: 1.2; opacity: 0.6; }
	.frames path { stroke-linejoin: round; stroke-linecap: round; }
	figcaption { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; }
	.swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; }
	.name { font-weight: 600; }
	.meta { color: var(--muted); margin-left: auto; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<header>
	<h1>Hexiamond — Standard board placement frequency</h1>
	<p>Exhaustive traversal of the standard board yielded <strong>${data.solutions.toLocaleString()}</strong> distinct solutions
	(${data.cellCount} cells, 12 blocks). Each graph overlays every legal position of one block as a frame line;
	brighter, heavier lines mark positions used in more solutions, and more frequent frames are drawn on top.</p>
</header>
<main class="grid-wrap">
${cards}
</main>
</body>
</html>`;

const outPath = resolve(__dirname, "../public/hexiamond/std-frequency.html");
mkdirSync(dirname(outPath), {recursive: true});
writeFileSync(outPath, html);
console.log(`Wrote ${outPath} (${data.blocks.length} graphs, ${data.solutions} solutions).`);
