"use strict";
const { src, dest, parallel, series, watch } = require("gulp");
const nodePath = require("path");
const fs = require("fs");

const autoprefixer = require("autoprefixer"),
	babel = require("gulp-babel"),
	browserSync = require("browser-sync"),
	cleanCSS = require("gulp-clean-css"),
	del = require("del"),
	iconfont = require("gulp-iconfont"),
	iconfontCss = require("gulp-iconfont-css"),
	include = require("gulp-include"),
	named = require("vinyl-named"),
	svgo = require("gulp-svgo"),
	postcss = require("gulp-postcss"),
	mqpacker = require("css-mqpacker"),
	sass = require("gulp-sass"),
	sourcemaps = require("gulp-sourcemaps"),
	spritesmith = require("gulp.spritesmith-multi"),
	svgSprite = require("gulp-svg-sprites"),
	wait = require("gulp-wait"),
	webpack = require("webpack-stream"),
	pug = require("gulp-pug-i18n"),
	shell = require("shelljs"),
	gulpRevAll = require("gulp-rev-all"),
	slugify = require("slugify"),
	zip = require("gulp-zip");

const { name: productName } = require("./package.json");

const DEFAULT_LOCALE = "ru";

const config = {
	pug: true, // Enable pug view engine
	sprites: true, // use png stprites in project
	spritesSVG: true, // use SVG stprites in project
	fico: true, // use font icons
	webpackJS: true, // build JS using webpack
	reload: true, // auto browser reload,
	commonLocalesRoot: false, // true - .html files for all localizations in root folder, false - localizations in {{locale}}/ folder
};

const path = {
	src: {
		html: "src/*" + (config.pug ? ".pug" : ".html"),
		templates: "src/templates/*.pug",
		style: "src/style/*.{sass,scss}",
		bootstrap: "src/bootstrap/bootstrap.scss",
		img: "src/img/**/*.*",
		sprite: "src/sprite/**/*.{jpg,jpeg,png}",
		spriteSVG: "src/sprite_svg/*.svg",
		svgico: "src/svgico/*.svg",
		js: "src/ts/*.{js,ts}",
		fonts: "src/fonts/**/*.*",
		svg: "src/svg/**/*.*",
		copy: "src/copy/**/*.*",
	},
	build: {
		root: "build/",
		style: "build/css/",
		fonts: "build/fonts/",
		js: "build/js/",
		img: "build/img/",
		svg: "build/img/svg",
	},
	deploy: {
		root: "www/",
		js: "www/js/",
		style: "www/css/",
		img: "www/img/",
		svg: "www/img/svg",
		fonts: "www/fonts/",
	},
	archive: {
		root: "archive/",
		assets: "archive/assets/",
		zip: "archive/_zip/",
	},
	watch: {
		html: "src/**/*" + (config.pug ? ".pug" : ".html"),
		locales: "src/locale/*",
		templates: "src/templates/*.pug",
		js: "src/ts/**/*.{js,ts}",
		style: "src/style/**/*.{scss,sass,css}",
		bootstrap: "src/bootstrap/*.+(scss|sass)",
		img: "src/img/**/*.+{jpg,jpeg,png,gif,ico}",
		sprite: "src/sprite/**/*.{jpg,jpeg,png}",
		spriteSVG: "src/sprite_svg/*.svg",
		svg: "src/svg/*.svg",
		svgico: "src/svgico/*.svg",
		favicon: "src/**/*.*",
		fonts: "src/fonts/**/*.*",
		copy: "src/copy/**/*.*",
	},
};

const processors = [
	autoprefixer({
		cascade: false,
	}),
	mqpacker({
		sort: function (a, b) {
			a = a.replace(/\D/g, "");
			b = b.replace(/\D/g, "");
			return b - a;
			// replace this with a-b for Mobile First approach
		},
	}),
];

function html() {
	return src(path.src.html)
		.pipe(
			config.pug
				? pug({
						i18n: {
							namespace: "LANG",
							locales: "src/locale/*", // locales: en.yml, de.json,
							filename: config.commonLocalesRoot
								? "{{basename}}.{{lang}}.html"
								: "{{{lang}}/}{{basename}}.html",
							default: DEFAULT_LOCALE,
						},
						data: {
							url(LANG, baseUrl) {
								const locale = LANG.locale || LANG;

								const urlLocale = DEFAULT_LOCALE === locale ? "" : locale;
								return nodePath.join(`/${urlLocale}/`, baseUrl);
							},
						},
						pretty: true, // Pug option
				  })
				: include()
		)
		.on("error", function (err) {
			console.log(err.message);
			this.emit("end");
		})
		.pipe(dest(path.build.root))
		.pipe(
			browserSync.reload({
				stream: true,
			})
		);
}
function htmlDeploy() {
	return src(path.src.html)
		.pipe(
			config.pug
				? pug({
						i18n: {
							namespace: "LANG",
							locales: "src/locale/*", // locales: en.yml, de.json,
							filename: "{{{lang}}/}{{basename}}.html",
							default: DEFAULT_LOCALE,
						},
						data: {
							url(LANG, baseUrl) {
								const locale = LANG.locale || LANG;
								const urlLocale = DEFAULT_LOCALE === locale ? "" : locale;
								return nodePath.join(`/${urlLocale}/`, baseUrl);
							},
						},
						pretty: true, // Pug option
				  })
				: include()
		)
		.on("error", function (err) {
			console.log(err.message);
			this.emit("end");
		})
		.pipe(dest(path.deploy.root));
}

function htmlArchive(done) {
	const locales = fs
		.readdirSync("src/locale/")
		.filter((file) => nodePath.extname(file) === ".json")
		.map((locale) => locale.replace(".json", ""));
	const htmlBuildPromises = [];

	if (locales.length) {
		for (let i = 0; i < locales.length; i++) {
			const loc = locales[i];
			htmlBuildPromises.push(
				streamPromise(
					src(path.src.html)
						.pipe(
							pug({
								i18n: {
									namespace: "LANG",
									locales: `src/locale/${loc}.json`,
									filename: `{{{lang}}/}{{basename}}.html`,
								},
								data: {
									url(LANG, baseUrl) {
										const locale = LANG.locale || LANG;
										const urlLocale = loc === locale ? "" : locale;
										return nodePath.join(`/${urlLocale}/`, baseUrl);
									},
								},
								pretty: true, // Pug option
							})
						)
						.on("error", function (err) {
							console.log(err.message);
							this.emit("end");
						})
						.pipe(dest(path.archive.root))
				)
			);
			htmlBuildPromises.push(
				streamPromise(
					src(path.archive.assets + "/**").pipe(
						dest(`${path.archive.root}/${loc}`)
					)
				)
			);
		}
		return Promise.all(htmlBuildPromises);
	}
	return done();
}
function zipResult(done) {
	const locales = fs
		.readdirSync("src/locale/")
		.filter((file) => nodePath.extname(file) === ".json")
		.map((locale) => locale.replace(".json", ""));
	const zipPromises = [];

	if (locales.length) {
		for (let i = 0; i < locales.length; i++) {
			const loc = locales[i];
			zipPromises.push(
				streamPromise(
					src(`${path.archive.root}/${loc}/**`)
						.pipe(zip(`${loc}${productName ? "-" + productName : ""}.zip`))
						.on("error", function (err) {
							console.log(err.message);
							this.emit("end");
						})
						.pipe(dest(path.archive.zip))
				)
			);
		}
		return Promise.all(zipPromises);
	}
	return done();
}

function css() {
	return src(path.src.style)
		.pipe(sourcemaps.init({ largeFile: true }))
		.pipe(wait(200))
		.pipe(sass({ includePaths: ["node_modules/"] }).on("error", sass.logError))
		.pipe(postcss(processors))
		.pipe(cleanCSS())
		.pipe(sourcemaps.write("maps"))
		.pipe(dest(path.build.style))
		.pipe(
			browserSync.reload({
				stream: true,
			})
		);
}
function cssDeploy() {
	return src(path.src.style)
		.pipe(wait(200))
		.pipe(sass({ includePaths: ["node_modules/"] }).on("error", sass.logError))
		.pipe(postcss(processors))
		.pipe(cleanCSS())
		.pipe(dest(path.deploy.style));
}

function js() {
	if (config.webpackJS) {
		return src(path.src.js)
			.pipe(named())
			.pipe(
				webpack({
					mode: "development",
					devtool: "source-map",
					module: {
						rules: [
							{
								test: /\.(js|jsx|tsx|ts)$/,
								loader: "babel-loader",
								exclude: /(node_modules)/,
								query: {
									presets: ["@babel/env", "@babel/preset-typescript"],
									plugins: [
										"@babel/plugin-proposal-object-rest-spread",
										"@babel/plugin-proposal-class-properties",
									],
								},
								resolve: {
									extensions: [".ts", ".js"],
								},
							},
						],
					},

					externals: {
						jquery: "jQuery",
					},
				})
			)
			.on("error", function (err) {
				this.emit("end");
			})
			.pipe(dest(path.build.js))
			.pipe(
				browserSync.reload({
					stream: true,
				})
			);
	} else {
		return src(path.src.js)
			.pipe(sourcemaps.init({ largeFile: true }))
			.pipe(include())
			.pipe(
				babel({
					presets: ["@babel/env"],
				})
			)
			.pipe(sourcemaps.write("../maps"))
			.pipe(dest(path.build.js))
			.on("error", function (err) {
				this.emit("end");
			})
			.pipe(
				browserSync.reload({
					stream: true,
				})
			);
	}
}
function jsDeploy() {
	if (config.webpackJS) {
		return src(path.src.js)
			.pipe(named())
			.pipe(
				webpack({
					mode: "production",
					module: {
						rules: [
							{
								test: /\.(js|jsx|tsx|ts)$/,
								loader: "babel-loader",
								exclude: /(node_modules)/,
								query: {
									presets: ["@babel/env", "@babel/preset-typescript"],
									plugins: [
										"@babel/plugin-proposal-object-rest-spread",
										"@babel/plugin-proposal-class-properties",
									],
								},
								resolve: {
									extensions: [".ts", ".js"],
								},
							},
						],
					},

					externals: {
						jquery: "jQuery",
					},
				})
			)
			.on("error", function (err) {
				this.emit("end");
			})
			.pipe(dest(path.deploy.js));
	} else {
		return src(path.src.js)
			.pipe(include())
			.pipe(
				babel({
					presets: ["@babel/env"],
				})
			)
			.pipe(dest(path.deploy.js))
			.on("error", function (err) {
				this.emit("end");
			});
	}
}

function sprite(done) {
	if (!config.sprites) return done();

	const spritePath = "src/style/libs/sprite.sass";
	if (!fs.existsSync(spritePath)) {
		fs.writeFileSync(spritePath, "");
	}

	const options = {
		spritesmith: function (option, sprite) {
			option.imgName = sprite + ".png";
			option.cssName = sprite + ".sass";
			option.imgPath = "../img/" + sprite + ".png";
			option.padding = 10;
			delete option.cssTemplate;
		},
	};
	const spriteData = src(path.src.sprite).pipe(spritesmith(options));
	spriteData.img.pipe(dest(path.build.img));
	spriteData.css.pipe(dest("src/style/libs/")).pipe(
		browserSync.reload({
			stream: true,
		})
	);
	return done();
}
function spriteSVG(done) {
	if (!config.spritesSVG) return done();
	return src(path.src.spriteSVG)
		.pipe(wait(3000))
		.pipe(
			svgSprite({
				mode: "symbols",
				preview: {
					symbols: "../../preview/symbols.html",
				},
				selector: "%f",
				svg: {
					symbols: "symbols.svg",
				},
				transformData: function (data, config) {
					data.svg.map(function (item) {
						item.data = item.data.replace(
							/id=\"([^\"]+)\"/gm,
							'id="' + item.name + '-$1"'
						);
						item.data = item.data.replace(
							/fill=\"url\(\#([^\"]+)\)\"/gm,
							'fill="url(#' + item.name + '-$1)"'
						);
						item.data = item.data.replace(
							/stroke=\"url\(\#([^\"]+)\)\"/gm,
							'stroke="url(#' + item.name + '-$1)"'
						);
						item.data = item.data.replace(
							/mask=\"url\(\#([^\"]+)\)\"/gm,
							'mask="url(#' + item.name + '-$1)"'
						);
						item.data = item.data.replace(
							'id="' + item.name + "-" + item.name + '"',
							'id="' + item.name + '"'
						);
						return item;
					});
					return data;
				},
			})
		)
		.on("error", function (err) {
			this.emit("end");
		})
		.pipe(dest("src/img/svg"));
}

function fico(done) {
	if (!config.fico) return done();
	const iconsPath = "src/style/partials/font-icons.scss";
	if (!fs.existsSync(iconsPath)) {
		fs.writeFileSync(iconsPath, "");
	}

	return src(path.src.svgico)
		.pipe(wait(1000))
		.pipe(svgo())
		.pipe(
			iconfontCss({
				fontName: "fico", // required
				target: iconsPath,
				targetPath: "../../style/partials/font-icons.scss",
				fontPath: "../fonts/icons/",
				cssClass: "fico",
			})
		)
		.pipe(
			iconfont({
				fontName: "fico", // required
				prependUnicode: true, // recommended option
				formats: ["ttf", "eot", "woff", "woff2", "svg"], // default, 'woff2' and 'svg' are available
				normalize: true,
				fontHeight: 1001,
				fontStyle: "normal",
				fontWeight: "normal",
			})
		)
		.on("error", function (err) {
			this.emit("end");
		})
		.pipe(dest("src/fonts/icons"));
}

function fonts() {
	return src(path.src.fonts).pipe(dest(path.build.fonts));
}
function fontsDeploy() {
	return src(path.src.fonts).pipe(dest(path.deploy.fonts));
}
function images() {
	return src(path.src.img).pipe(dest(path.build.img));
}
function imagesDeploy() {
	return src(path.src.img).pipe(dest(path.deploy.img));
}
function svg() {
	return src(path.src.svg).pipe(svgo()).pipe(dest(path.build.svg));
}
function svgDeploy() {
	return src(path.src.svg).pipe(svgo()).pipe(dest(path.deploy.svg));
}
function copy() {
	return src(path.src.copy).pipe(dest(path.build.root));
}
function copyDeploy() {
	return src(path.src.copy).pipe(dest(path.deploy.root));
}
function startServer(done) {
	if (!config.reload) return done();
	browserSync.init({
		server: {
			baseDir: path.build.root,
		},
		startPath: "/",
		tunnel: false,
		host: "localhost",
		port: 9000,
		logPrefix: "gulper",
	});
	done();
}

function revAll(done, rootPath = path.build.root) {
	if (config.commonLocalesRoot) {
		return done();
	}
	return src(rootPath + "**")
		.pipe(
			gulpRevAll.revision({
				dontRenameFile: [".*"],
				dontUpdateReference: [".html", ".map"],
				transformFilename: function (file, hash) {
					return nodePath.basename(file.path);
				},
				transformPath: function (rev, source, path) {
					if (rev.startsWith("/") || rev.startsWith("http")) {
						return rev;
					}
					return "/" + rev;
				},
			})
		)
		.pipe(dest(rootPath));
}

function reloadBrowser(done) {
	if (!config.reload) return done();
	browserSync.reload();
	done();
}

function push() {
	const commitMessage = "Auto-commit " + new Date().getTime();

	if (!shell.which("git")) {
		shell.echo("Sorry, this script requires git");
		shell.exit(1);
	} else {
		shell.cd("www");
		if (
			shell.exec(`git add . && git commit -m "${commitMessage}"`).code !== 0
		) {
			shell.echo("Error: Git commit failed");
			shell.exit(1);
		} else {
			shell.echo("Success commit");
			shell.exec("git push");
		}
	}
}

function watchSource() {
	watch(
		path.watch.locales,
		series(
			html,
			buildTemplates.bind(null, path.build.root),
			revAll,
			reloadBrowser
		)
	);
	watch(path.watch.html, series(html, revAll, reloadBrowser));
	watch(
		path.watch.templates,
		series(
			html,
			buildTemplates.bind(null, path.build.root),
			revAll,
			reloadBrowser
		)
	);
	watch(path.watch.style, series(css, revAll, reloadBrowser));
	watch(path.watch.js, series(js, revAll, reloadBrowser));
	watch(path.watch.fonts, series(fonts, revAll, reloadBrowser));
	watch(path.watch.copy, series(copy, revAll, reloadBrowser));
	watch(path.watch.img, series(images, revAll, reloadBrowser));
	watch(path.watch.svg, series(svg, revAll, reloadBrowser));
	if (config.sprites) {
		watch(path.watch.sprite, series(sprite, images, revAll, reloadBrowser));
	}
	if (config.spritesSVG) {
		watch(
			path.watch.spriteSVG,
			series(spriteSVG, images, revAll, reloadBrowser)
		);
	}
	if (config.fico) {
		watch(path.watch.svgico, series(fico, revAll, reloadBrowser));
	}
}
function clean(done) {
	del.sync(path.build.root);
	return done();
}
function cleanDeploy(done) {
	del.sync(path.deploy.root);
	return done();
}
function cleanArchive(done) {
	del.sync(path.archive.root);
	return done();
}
function streamPromise(stream) {
	return new Promise((resolve, reject) => {
		stream.on("end", () => {
			resolve("end");
		});
		stream.on("finish", () => {
			resolve("finish");
		});
		stream.on("error", (error) => {
			reject(error);
		});
	});
}

function buildTemplates(destPath = path.deploy.root, done) {
	const batchData = JSON.parse(fs.readFileSync("./batch.json"));
	const htmlBuildPromises = [];
	if (batchData.length) {
		for (let i = 0; i < batchData.length; i++) {
			const data = batchData[i];
			const slug = slugify(data.key);
			const templatePath = data.template;
			if (!templatePath) {
				continue;
			}
			htmlBuildPromises.push(
				streamPromise(
					src(templatePath)
						.pipe(
							pug({
								i18n: {
									namespace: "LANG",
									locales: "src/locale/*", // locales: en.yml, de.json,
									filename: `{{{lang}}/}${slug}.html`,
									default: DEFAULT_LOCALE,
								},
								data: {
									template: data,
									url(LANG, baseUrl) {
										const locale = LANG.locale || LANG;
										const urlLocale = DEFAULT_LOCALE === locale ? "" : locale;
										return nodePath.join(`/${urlLocale}/`, baseUrl);
									},
								},
								pretty: true, // Pug option
							})
						)
						.on("error", function (err) {
							console.log(err.message);
							this.emit("end");
						})
						.pipe(dest(destPath))
				)
			);
		}

		return Promise.all(htmlBuildPromises);
	}
	return done();
}

exports.html = html;
exports.css = css;
exports.js = js;
exports.fonts = fonts;
exports.push = push;
exports.images = series(
	config.sprites ? sprite : (done) => done(),
	config.spritesSVG ? spriteSVG : (done) => done(),
	images,
	revAll
);
exports.default = series(
	clean,
	parallel(
		html,
		buildTemplates.bind(null, path.build.root),
		css,
		js,
		fico,
		fonts,
		copy,
		exports.images,
		svg
	),
	revAll
);
exports.deploy = series(
	fico,
	config.sprites ? sprite : (done) => done(),
	config.spritesSVG ? spriteSVG : (done) => done(),
	parallel(
		htmlDeploy,
		buildTemplates.bind(null, path.deploy.root),
		cssDeploy,
		jsDeploy,
		fontsDeploy,
		copyDeploy,
		imagesDeploy,
		svgDeploy
	),
	(done) => revAll(done, path.deploy.root)
);

// archive task

/**
 * 1. Build assets and store in temp folder
 * 2. Build html N times based on locale files
 * 3. Copy assets + html to new folder
 * 4. Archive folder
 */
exports.archive = series(
	cleanDeploy,
	cleanArchive,
	fico,
	config.sprites ? sprite : (done) => done(),
	config.spritesSVG ? spriteSVG : (done) => done(),
	parallel(
		cssDeploy,
		jsDeploy,
		fontsDeploy,
		copyDeploy,
		imagesDeploy,
		svgDeploy
	),
	(done) => src(path.deploy.root + "/**").pipe(dest(path.archive.assets)),
	htmlArchive,
	zipResult
);

exports.watch = series(exports.default, startServer, watchSource);
