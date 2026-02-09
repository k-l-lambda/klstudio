#!/usr/bin/env node

/**
 * CDP (Chrome DevTools Protocol) helper script for chrome-debug skill.
 *
 * Usage:
 *   node cdp.js <command> [options]
 *
 * Commands:
 *   page-id                          Get the page ID for the dev server tab
 *   navigate <url>                   Navigate to a URL
 *   screenshot [output-path]         Take a screenshot (default: /tmp/klstudio-screenshots/debug-<ts>.png)
 *   console [duration-ms]            Capture console messages (default: 5000ms)
 *   eval <expression>                Evaluate JavaScript in page context
 *   network [duration-ms]            Monitor network requests (default: 5000ms)
 *   dom                              Get accessibility tree summary
 *   reload                           Reload the page
 */

const WebSocket = require("ws");
const fs = require("fs");
const http = require("http");

const CDP_HOST = "127.0.0.1";
const CDP_PORT = 9222;
const DEV_SERVER = "localhost:8130";

function fetchJSON(path) {
	return new Promise((resolve, reject) => {
		http.get(`http://${CDP_HOST}:${CDP_PORT}${path}`, (res) => {
			let data = "";
			res.on("data", (chunk) => data += chunk);
			res.on("end", () => {
				try { resolve(JSON.parse(data)); }
				catch (e) { reject(new Error("Invalid JSON: " + data)); }
			});
		}).on("error", reject);
	});
}

function connectPage(pageId) {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(`ws://${CDP_HOST}:${CDP_PORT}/devtools/page/${pageId}`);
		ws.on("open", () => resolve(ws));
		ws.on("error", reject);
	});
}

function sendCommand(ws, method, params = {}) {
	const id = Math.floor(Math.random() * 100000);
	return new Promise((resolve, reject) => {
		const handler = (data) => {
			const msg = JSON.parse(data);
			if (msg.id === id) {
				ws.off("message", handler);
				if (msg.error) reject(new Error(JSON.stringify(msg.error)));
				else resolve(msg.result);
			}
		};
		ws.on("message", handler);
		ws.send(JSON.stringify({ id, method, params }));
	});
}

async function getPageId() {
	const pages = await fetchJSON("/json/list");
	const page = pages.find(p => p.url.includes(DEV_SERVER)) || pages[0];
	if (!page) throw new Error("No pages found. Is Chrome running with --remote-debugging-port=9222?");
	return page.id;
}

async function main() {
	const [,, command, ...args] = process.argv;

	if (!command || command === "--help") {
		console.log("Usage: node cdp.js <command> [options]");
		console.log("Commands: page-id, navigate, screenshot, console, eval, network, dom, reload");
		process.exit(0);
	}

	try {
		switch (command) {
		case "page-id": {
			const id = await getPageId();
			console.log(id);
			break;
		}

		case "navigate": {
			const url = args[0] || `http://${DEV_SERVER}`;
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			const result = await sendCommand(ws, "Page.navigate", { url });
			console.log("Navigated:", JSON.stringify(result));
			await new Promise(r => setTimeout(r, 2000));
			ws.close();
			break;
		}

		case "screenshot": {
			const dir = "/tmp/klstudio-screenshots";
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			const outFile = args[0] || `${dir}/debug-${Date.now()}.png`;
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			const result = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
			fs.writeFileSync(outFile, Buffer.from(result.data, "base64"));
			console.log(outFile);
			ws.close();
			break;
		}

		case "console": {
			const duration = parseInt(args[0]) || 5000;
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			const messages = [];

			ws.on("message", (data) => {
				const msg = JSON.parse(data);
				if (msg.method === "Runtime.consoleAPICalled") {
					messages.push({
						type: msg.params.type,
						text: msg.params.args.map(a => a.value || a.description || "").join(" "),
					});
				}
				if (msg.method === "Runtime.exceptionThrown") {
					messages.push({
						type: "exception",
						text: msg.params.exceptionDetails.text +
							(msg.params.exceptionDetails.exception ? ": " + (msg.params.exceptionDetails.exception.description || "") : ""),
					});
				}
			});

			await sendCommand(ws, "Runtime.enable");
			await sendCommand(ws, "Page.reload");

			await new Promise(r => setTimeout(r, duration));
			if (messages.length) {
				messages.forEach(m => console.log(`[${m.type}] ${m.text}`));
			}
			else {
				console.log("(no console messages captured)");
			}
			ws.close();
			break;
		}

		case "eval": {
			const expression = args.join(" ");
			if (!expression) { console.error("Usage: node cdp.js eval <expression>"); process.exit(1); }
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			const result = await sendCommand(ws, "Runtime.evaluate", { expression, returnByValue: true });
			if (result.exceptionDetails) {
				console.error("Error:", JSON.stringify(result.exceptionDetails, null, 2));
				process.exitCode = 1;
			}
			else {
				console.log(JSON.stringify(result.result, null, 2));
			}
			ws.close();
			break;
		}

		case "network": {
			const duration = parseInt(args[0]) || 5000;
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			const requests = [];

			ws.on("message", (data) => {
				const msg = JSON.parse(data);
				if (msg.method === "Network.requestWillBeSent") {
					requests.push({
						id: msg.params.requestId,
						method: msg.params.request.method,
						url: msg.params.request.url,
						status: null,
					});
				}
				if (msg.method === "Network.responseReceived") {
					const r = requests.find(r => r.id === msg.params.requestId);
					if (r) r.status = msg.params.response.status;
				}
			});

			await sendCommand(ws, "Network.enable");
			await sendCommand(ws, "Page.reload");

			await new Promise(r => setTimeout(r, duration));
			console.log(`Network requests (${requests.length} total):`);
			requests.forEach(r => console.log(`  [${r.method} ${r.status || "..."}] ${r.url}`));
			ws.close();
			break;
		}

		case "dom": {
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			let result;
			try {
				result = await sendCommand(ws, "Accessibility.getFullAXTree");
			}
			catch {
				// Fallback: use DOM.getDocument + DOM.getFlattenedDocument
				const doc = await sendCommand(ws, "DOM.getDocument", { depth: -1 });
				console.log(JSON.stringify(doc, null, 2).slice(0, 3000));
				ws.close();
				break;
			}
			if (result && result.nodes) {
				const nodes = result.nodes.slice(0, 80);
				nodes.forEach(n => {
					const name = (n.name && n.name.value) || "";
					const role = (n.role && n.role.value) || "";
					if (role && role !== "none" && role !== "GenericContainer") {
						console.log(`${n.nodeId} ${role}${name ? ` "${name}"` : ""}`);
					}
				});
				if (result.nodes.length > 80) console.log(`... (${result.nodes.length} total nodes)`);
			}
			ws.close();
			break;
		}

		case "reload": {
			const pageId = await getPageId();
			const ws = await connectPage(pageId);
			await sendCommand(ws, "Page.reload");
			console.log("Page reloaded");
			await new Promise(r => setTimeout(r, 1000));
			ws.close();
			break;
		}

		default:
			console.error(`Unknown command: ${command}`);
			console.error("Commands: page-id, navigate, screenshot, console, eval, network, dom, reload");
			process.exit(1);
		}
	}
	catch (err) {
		console.error("Error:", err.message);
		process.exit(1);
	}
}

main();
