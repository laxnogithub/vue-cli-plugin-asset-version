/*
 * @Description:
 * @Version: 1.0.0
 * @Author: lax
 * @Date: 2021-01-03 17:17:28
 * @LastEditors: lax
 * @LastEditTime: 2022-02-03 14:41:41
 * @FilePath: \vue-cli-plugin-asset-version\packages\message.js
 */
const Chalk = require("chalk");
const consola = require("consola");
const log = consola.log;
module.exports = {
	WARN: {
		packageFileError: "not find package.json in project skip..",
		ossFileError: "not find oss.js in workspace skip...",
	},
	ERROR: {
		cachePathError: (path) => `this path(${path}) can\`t used,`,
	},
	STATE: {
		start: `\n##############################################\n########## ali-oss-plugin start... ###########\n##############################################\n`,
		upload: (name) => `* filename: ${name}  upload!`,
		notUpload: (name) => `* filename: ${name}  not upload!`,
		end: `\n##############################################\n######### success: upload oss over ! #########\n##############################################\n`,
	},

	success: (msg) => {
		log(Chalk.greenBright(msg));
	},
	warn: (msg) => {
		log(Chalk.yellowBright(msg));
	},
	error: (msg) => {
		log(Chalk.redBright(msg));
	},
};
