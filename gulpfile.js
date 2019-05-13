const { src, dest, parallel, series, watch } = require("gulp");

const pug = require("gulp-pug"),
  include = require("gulp-include"),
  sass = require("gulp-sass"),
  postcss = require("gulp-postcss"),
  autoprefixer = require("autoprefixer"),
  mqpacker = require("css-mqpacker"),
  sourcemaps = require("gulp-sourcemaps"),
  cleanCSS = require("gulp-clean-css"),
  browserSync = require("browser-sync"),
  del = require("del"),
  named = require("vinyl-named"),
  webpack = require("webpack-stream");

const config = {
  pug: true,
  reload: true
};

const path = {
  src: {
    html: "src/*" + (config.pug ? ".pug" : ".html"),
    style: "src/style/*.{sass,scss}",
    img: "src/img/**/*.*",
    js: "src/js/*.js",
    fonts: "src/fonts/**/*.*",
    copy: "src/copy/**/*.*"
  },
  build: {
    root: "build/",
    style: "build/css/",
    fonts: "build/fonts/",
    js: "build/js/",
    img: "build/img/"
  },
  watch: {
    html: "src/**/*" + (config.pug ? ".pug" : ".html"),
    js: "src/js/**/*.js",
    style: "src/style/**/*.+{scss,sass,css}",
    img: "src/img/**/*.+{jpg,jpeg,png,gif,ico}",
    sprite: "src/sprite/**/*.+{jpg,jpeg,png}",
    spriteSVG: "src/spriteSVG/*.svg",
    svg: "src/svg/*.svg",
    svgico: "src/svgico/*.svg",
    favicon: "src/**/*.*",
    fonts: "src/fonts/**/*.*",
    copy: "src/copy/**/*.*"
  }
};

function html() {
  return src(path.src.html)
    .pipe(config.pug ? pug() : include())
    .on("error", function(err) {
      this.emit("end");
    })
    .pipe(dest(path.build.root))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
}

function css() {
  const processors = [
    autoprefixer({
      browsers: ["> 5%"],
      cascade: false
    }),
    mqpacker({
      sort: function(a, b) {
        a = a.replace(/\D/g, "");
        b = b.replace(/\D/g, "");
        return b - a;
        // replace this with a-b for Mobile First approach
      }
    })
  ];
  return src(path.src.style)
    .pipe(sourcemaps.init({ largeFile: true }))
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(processors))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("../maps"))
    .pipe(dest(path.build.style))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
}

function js() {
  return src(path.src.js)
    .pipe(named())
    .pipe(
      webpack({
        mode: "development",
        devtool: "source-map",
        module: {
          rules: [
            {
              test: /\.(js)$/,
              loader: "babel-loader",
              exclude: /(node_modules)/,
              query: {
                presets: ["env"],
                plugins: ["transform-object-rest-spread"]
              }
            }
          ]
        },

        externals: {
          jquery: "jQuery"
        }
      })
    )
    .on("error", function(err) {
      this.emit("end");
    })
    .pipe(dest(path.build.js))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
}

function fonts() {
  return src(path.src.fonts).pipe(dest(path.build.fonts));
}
function images() {
  return src(path.src.img).pipe(dest(path.build.img));
}
function copy() {
  return src(path.src.copy).pipe(dest(path.build.root));
}

function startServer(done) {
  if (!config.reload) return done();
  browserSync.init({
    server: {
      baseDir: path.build.root
    },
    tunnel: false,
    host: "localhost",
    port: 9000,
    logPrefix: "gulper"
  });
  done();
}

function reloadBrowser(done) {
  if (!config.reload) return done();
  browserSync.reload();
  done();
}
function watchSource() {
  watch(path.watch.html, series(html, reloadBrowser));
  watch(path.watch.style, series(css, reloadBrowser));
  watch(path.watch.js, series(js, reloadBrowser));
  watch(path.watch.fonts, series(fonts, reloadBrowser));
  watch(path.watch.copy, series(copy, reloadBrowser));
  watch(path.watch.img, series(images, reloadBrowser));
}
function clean(done) {
  del.sync(path.build.root);
  return done();
}

exports.html = html;
exports.css = css;
exports.js = js;
exports.fonts = fonts;
exports.default = series(clean, parallel(html, css, js, fonts, copy, images));
exports.watch = series(exports.default, startServer, watchSource);
