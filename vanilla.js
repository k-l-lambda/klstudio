
import path from "path";
import puppeteer from "puppeteer";



const main = async () => {
	const pathToExtension = [
		"HoverZoom",
		"Proxy-SwitchySharp",
		"Stylus",
	].map(dir => path.join(process.cwd(), "extensions/", dir)).join(",");

	const browser = await puppeteer.launch({
		ignoreHTTPSErrors: true,
		headless: false,
		defaultViewport: null,
		userDataDir: "userData",
		args: [
			"--disable-web-security",
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`,
			"--disable-features=site-per-process",
		],
	});
};


main();
