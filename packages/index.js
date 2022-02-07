/*
 * @Description: webpack assets hash
 * webpack: https://webpack.js.org/api/compilation-object/
 * @Version: 1.0.0
 * @Author: lax
 * @Date: 2020-09-14 16:58:38
 * @LastEditors: lax
 * @LastEditTime: 2022-02-04 13:17:13
 */
const path = require("path");
const fs = require("fs-extra");
const PLUGIN_NAME = "assetVersionPlugin";
const MSG = require(path.join(__dirname, "./message.js"));
const CACHE_PATH = ".cache/webpack/static";
const CACHE_FILE_NAME = "local.json";
const MARK_FILE_NAME = "mark.json";
const { md5, mapToJson } = require(path.join(__dirname, "./tools"));
const merge = require("webpack-merge");
class AssetVersion {
	constructor(p = {}) {
		this.p = p;
		// this plugin can be run
		this.use = p.use !== undefined ? p.use : true;
		// ali oss config
		this.config = p.config || {};
		//  plugin name
		this.name = PLUGIN_NAME;
		// mark
		this.mark = md5(this.name);
		// select ignore cache path check
		this.ignoreCacheCheck =
			p.ignoreCacheCheck !== undefined ? Boolean(p.ignoreCacheCheck) : false;
	}
	apply(compiler) {
		// options.use = false
		if (!this.use) return;
		// init error
		if (!this._init(compiler)) return;

		compiler.hooks.afterEmit.tapAsync(this.name, (compilation, callback) => {
			const assets = compilation.getAssets();
			this.saveHash(assets);
			callback();
		});

		// update asset info
		compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
			compilation.hooks.optimizeAssets.tap(this.name, (assets) => {
				this.generateAssetInfo(assets, compilation);
			});
		});
	}
	generateAssetInfo(assets, compilation) {
		Object.keys(assets).map((key) => {
			const source = assets[key].source();
			const assetInfo = compilation.assetInfo.get(key);
			const info = {};
			info.oldHash = this.hash.get(key);
			info.newHash = md5(source);
			info.updated = info.oldHash !== info.newHash;
			compilation.updateAsset(key, source, merge({}, assetInfo, info));
		});
	}
	generateHash(assets) {
		const map = new Map();
		assets.map((asset) => {
			map.set(asset.name, md5(asset.source.source()));
		});
		return map;
	}
	updateCache(hash = this.hash) {
		const str = mapToJson(hash);
		fs.writeJSONSync(`${this.cachePath}`, str);
	}
	saveHash(assets) {
		this.hash = this.generateHash(assets);
		this.updateCache();
	}
	_init(comp) {
		try {
			this.workspace = comp.context;
			this._generateOptions();
			!this.ignoreCacheCheck && this._checkCachePathCanBeUse();
			this.getCache();
			MSG.success(MSG.STATE.start);
			return true;
		} catch (error) {
			MSG.error(error);
			return false;
		}
	}
	getCache() {
		fs.ensureFileSync(`${this.cachePath}`);
		let file;
		try {
			file = require(`${this.cachePath}`);
		} catch (error) {
			file = {};
		}
		this.hash = new Map(Object.entries(file));
	}
	_generateOptions() {
		this.root = this.p.root || this.workspace;
		this.path = this.p.path || CACHE_PATH;
		this.name = this.p.cacheName || CACHE_FILE_NAME;
		this.markName = MARK_FILE_NAME;
		this.cachePath = this._generateCachePath();
		this.markPath = this._generateCachePath(this.markName);
	}
	_generateCachePath(name = this.name) {
		const result = path.resolve(this.root, this.path, name);
		return result;
	}
	_checkCachePathCanBeUse() {
		const dirExists = fs.existsSync(this.cachePath);
		const canUse =
			fs.existsSync(this.markPath) &&
			(() => {
				const markFile = require(`${this.markPath}`);
				const hash = markFile.hash || ``;
				return hash === this.mark;
			})();
		if (dirExists && canUse) return true;
		if (!dirExists && !canUse) return true;
		throw new Error();
	}
	_end() {
		MSG.success(MSG.STATE.end);
	}
}

module.exports = AssetVersion;
