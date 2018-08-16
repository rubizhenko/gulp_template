'use strict';

const gulp = require('gulp'),
	watch = require('gulp-watch'),
	sass = require('gulp-sass'),
	cssmin = require('gulp-minify-css'),
	autoprefixer = require('autoprefixer'),
	mqpacker = require("css-mqpacker"),
	postcss = require('gulp-postcss'),
	uglify = require('gulp-uglify'),
	sourcemaps = require('gulp-sourcemaps'),
	include = require("gulp-include"),
	htmlmin = require('gulp-htmlmin'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	rimraf = require('rimraf'),
	wait = require('gulp-wait'),
	browserSync = require("browser-sync"),
	svgSprite = require("gulp-svg-sprites"),
	spritesmith = require('gulp.spritesmith-multi'),
	svgo = require('gulp-svgo'),
	iconfont = require('gulp-iconfont'),
	iconfontCss = require('gulp-iconfont-css'),
	babel = require('gulp-babel'),
	reload = browserSync.reload;

var path = {
	src: {
		html: 'src/*.html',
		js: 'src/js/*.js',
		style: 'src/style/main.sass',
		img: 'src/img/**/*.*',
		svg: 'src/svg/*.svg',
		sprite: 'src/sprite/**/*.+(jpg|jpeg|png)',
		spriteSVG: 'src/spriteSVG/*.svg',
		svgico: 'src/svgico/*.svg',
		video: 'src/video/*.*',
		fonts: 'src/fonts/**/*.*'
	},
	build: {
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		img: 'build/img/',
		svg: 'build/img/svg',
		fonts: 'build/fonts/',
		video: 'build/video/',
	},
	deploy: {
		html: 'www/',
		js: 'www/js/',
		css: 'www/css/',
		img: 'www/img/',
		svg: 'www/img/svg',
		fonts: 'www/fonts/',
		video: 'www/video/',
	},
	watch: {
		html: 'src/**/*.html',
		js: 'src/js/**/*.js',
		style: 'src/style/**/*.+(scss|sass|css)',
		img: 'src/img/**/*.+(jpg|jpeg|png|gif|ico)',
		sprite: 'src/sprite/**/*.+(jpg|jpeg|png)',
		spriteSVG: 'src/spriteSVG/*.svg',
		svg: 'src/svg/*.svg',
		svgico: 'src/svgico/*.svg',
		video: 'src/video/*.*',
		fonts: 'src/fonts/**/*.*'
	},
	clean: './build'
};

var config = {
	server: {
		baseDir: "./build"
	},
	tunnel: false,
	host: 'localhost',
	port: 9000,
	logPrefix: "terraleads"
};

gulp.task('html:build', function () {
	gulp.src(path.src.html)
		.pipe(include())
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({
			stream: true
		}));
});

gulp.task('html:deploy', function () {
	gulp.src(path.src.html)
		.pipe(include())
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest(path.deploy.html));
});

gulp.task('js:build', function () {
	gulp.src(path.src.js)
		.pipe(include())
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(sourcemaps.init())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.js))
		.pipe(reload({
			stream: true
		}));
});
gulp.task('js:deploy', function () {
	gulp.src(path.src.js)
		.pipe(include())
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest(path.deploy.js));
});

gulp.task('style:build', function () {
	var processors = [
		autoprefixer({
			browsers: ['last 10 versions'],
			cascade: false
		}),
		mqpacker({
			sort: function (a, b) {
				a = a.replace(/\D/g, '');
				b = b.replace(/\D/g, '');
				return b - a;
				// replace this with a-b for Mobile First approach
			}
		})
	];
	gulp.src(path.src.style)
		.pipe(sourcemaps.init())
		.pipe(wait(500))
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss(processors))
		.pipe(cssmin())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css))
		.pipe(reload({
			stream: true
		}));
});
gulp.task('style:deploy', function () {
	var processors = [
		autoprefixer({
			browsers: ['last 10 versions'],
			cascade: false
		}),
		mqpacker({
			sort: function (a, b) {
				a = a.replace(/\D/g, '');
				b = b.replace(/\D/g, '');
				return b - a;
				// replace this with a-b for Mobile First approach
			}
		})
	];
	gulp.src(path.src.style)
		.pipe(wait(500))
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss(processors))
		.pipe(cssmin())
		.pipe(gulp.dest(path.deploy.css));
});

gulp.task('image:build', function () {
	gulp.src(path.src.img)
		.pipe(gulp.dest(path.build.img))
		.pipe(reload({
			stream: true
		}));
});
gulp.task('image:deploy', function () {
	gulp.src(path.build.img + '/**/*.*')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.deploy.img));
});
var options = {
	spritesmith: function (option, sprite){
		option.imgName = sprite + '.png';
		option.cssName = sprite + '.sass';
		option.imgPath = '../img/'+sprite+'.png';
		option.padding = 10;
		delete option.cssTemplate;
	},
};
gulp.task('sprite:build', function () {
	var spriteData = gulp.src(path.src.sprite)
		.pipe(spritesmith(options));
	spriteData.img
		.pipe(gulp.dest(path.build.img));
	spriteData.css
		.pipe(gulp.dest('src/style/libs/'))
		.pipe(reload({
			stream: true
		}));
});

gulp.task('svg:build', function () {
	return gulp.src(path.src.svg)
		.pipe(wait(3000))
		.pipe(svgo())
		.pipe(gulp.dest(path.build.svg));
});
gulp.task('svg:deploy', function () {
	return gulp.src(path.src.svg)
		.pipe(svgo())
		.pipe(gulp.dest(path.deploy.svg));
});

gulp.task('spriteSVG:build', function () {
	return gulp.src(path.src.spriteSVG)
		.pipe(wait(3000))
		.pipe(svgSprite({
			mode: "symbols",
			preview: {
				symbols: '../../preview/symbols.html'
			},
			selector: "%f",
			svg: {
				symbols: 'symbols.svg'
			},
			transformData: function (data, config) {
				data.svg.map(function (item) {
					item.data = item.data.replace(/id=\"([^\"]+)\"/gm, 'id="' + item.name + '-$1"');
					item.data = item.data.replace(/fill=\"url\(\#([^\"]+)\)\"/gm, 'fill="url(#' + item.name + '-$1)"');
					item.data = item.data.replace(/mask=\"url\(\#([^\"]+)\)\"/gm, 'mask="url(#' + item.name + '-$1)"');
					item.data = item.data.replace('id="' + item.name + '-' + item.name + '"', 'id="' + item.name + '"');
					return item;
				});
				return data;
			}
		}))
		.pipe(gulp.dest('src/img/svg'));
});

gulp.task('svg-ico:build', function () {
	return gulp.src(path.src.svgico)
		.pipe(wait(1000))
		.pipe(svgo())
		.pipe(iconfontCss({
			fontName: 'fico', // required
			target: 'src/style/partials/font-icons.scss',
			targetPath: '../../style/partials/font-icons.scss',
			fontPath: '../fonts/icons/',
			cssClass: 'fico'
		}))
		.pipe(iconfont({
			fontName: 'fico', // required
			prependUnicode: true, // recommended option
			formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'], // default, 'woff2' and 'svg' are available
			normalize: true,
			fontHeight: 1001,
			fontStyle: 'normal',
			fontWeight: 'normal'
		}))
		.pipe(gulp.dest('src/fonts/icons'));
});

gulp.task('fonts:build', function () {
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts));
});

gulp.task('fonts:deploy', function () {
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.deploy.fonts));
});


gulp.task('video:build', function () {
	gulp.src(path.src.video)
		.pipe(gulp.dest(path.build.video));
});

gulp.task('video:deploy', function () {
	gulp.src(path.src.video)
		.pipe(gulp.dest(path.deploy.video));
});

gulp.task('build', [
	'html:build',
	'js:build',
	'style:build',
	'svg:build',
	'clean-fonts',
	'svg-ico:build',
	'image:build',
	'sprite:build',
	'spriteSVG:build',
	'fonts:build',
]);

gulp.task('deploy', [
	'html:deploy',
	'js:deploy',
	'style:deploy',
	'fonts:deploy',
	'svg:deploy',
	'spriteSVG:build',
	'svg-ico:build',
	'image:deploy'
]);

gulp.task('watch', function () {
	watch([path.watch.html], function (event, cb) {
		gulp.start('html:build');
	});
	watch([path.watch.style], function (event, cb) {
		gulp.start('style:build');
	});
	watch([path.watch.js], function (event, cb) {
		gulp.start('js:build');
	});
	watch([path.watch.svg], function (event, cb) {
		gulp.start('svg:build');
	});
	watch([path.watch.svgico], function (event, cb) {
		gulp.start('svg-ico:build');
	});
	watch([path.watch.img], function (event, cb) {
		gulp.start('image:build');
	});
	watch([path.watch.sprite], function (event, cb) {
		gulp.start('sprite:build');
	});
	watch([path.watch.spriteSVG], function (event, cb) {
		gulp.start('spriteSVG:build');
	});
	watch([path.watch.fonts], function (event, cb) {
		gulp.start('fonts:build');
	});
	watch([path.watch.video], function (event, cb) {
		gulp.start('video:build');
	});
});

gulp.task('webserver', function () {
	browserSync(config);
});

gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

gulp.task('clean-fonts', function (cb) {
	rimraf('build/fonts/icons/*.*', cb);
});

gulp.task('default', ['build', 'webserver', 'watch']);