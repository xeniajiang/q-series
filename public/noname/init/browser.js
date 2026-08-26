import { __vitePreload } from "../../_virtual/preload-helper.js";

async function browserReady({ lib, game }) {
	lib.path = (await __vitePreload(async () => {
		const { default: path } = await import("../../vendor/pnpm/path-browserify-esm@1.0.6/modules/path-browserify-esm/index.esm.js");
		return { default: path };
	}, [], import.meta.url)).default;

	const resolveAsset = fileName => new URL(String(fileName).replace(/^\/+/, ""), new URL(lib.assetURL || "./", location.href));
	const fetchAsset = async fileName => {
		const url = resolveAsset(fileName);
		const response = await fetch(url);
		const contentType = response.headers.get("content-type") || "";
		if (!response.ok || (contentType.includes("text/html") && !url.pathname.endsWith(".html"))) {
			throw new Error(`静态文件不存在：${fileName}`);
		}
		return response;
	};

	game.export = function(data, name) {
		if (typeof data === "string") data = new Blob([data], { type: "text/plain" });
		const link = document.createElement("a");
		link.download = (name || "noname").replace(/\\|\/|:|\?|"|\*|<|>|\|/g, "-");
		link.href = URL.createObjectURL(data);
		link.click();
		setTimeout(() => URL.revokeObjectURL(link.href), 0);
	};
	game.exit = function() { window.onbeforeunload = null; window.close(); };
	game.open = function(url) { window.open(url); };
	game.checkFile = function(fileName, callback) {
		fetchAsset(fileName).then(() => callback?.(1)).catch(() => callback?.(-1));
	};
	game.checkDir = function(_dir, callback) { callback?.(-1); };
	game.readFile = function(fileName, callback = () => {}, error = () => {}) {
		fetchAsset(fileName).then(response => response.arrayBuffer()).then(callback).catch(error);
	};
	game.readFileAsText = function(fileName, callback = () => {}, error = () => {}) {
		fetchAsset(fileName).then(response => response.text()).then(callback).catch(error);
	};
	game.writeFile = function(_data, _path, _name, callback = () => {}) {
		callback(new Error("静态网页版不支持写入服务器文件"));
	};
	game.removeFile = function(_fileName, callback = () => {}) {
		callback(new Error("静态网页版不支持删除服务器文件"));
	};
	game.getFileList = function(_dir, _callback = () => {}, onerror = () => {}) {
		onerror(new Error("静态网页版不支持枚举服务器目录"));
	};
	game.ensureDirectory = function(_list, callback = () => {}) { callback(); };
	game.createDir = function(_directory, successCallback = () => {}) { successCallback(); };
	game.removeDir = function(_directory, _successCallback = () => {}, errorCallback = () => {}) {
		errorCallback(new Error("静态网页版不支持删除服务器目录"));
	};
}

export { browserReady as default };
