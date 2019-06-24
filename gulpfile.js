"use strict";
const { src, dest, parallel, series, watch } = require("gulp");

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
  pug = require("gulp-pug"),
  shell = require("shelljs");

const config = {
  pug: false,
  sprites: true,
  spritesSVG: true,
  fico: true,
  webpackJS: true,
  reload: true
};

const path = {
  src: {
    html: "src/*" + (config.pug ? ".pug" : ".html"),
    style: "src/style/*.{sass,scss}",
    bootstrap: "src/bootstrap/bootstrap.scss",
    img: "src/img/**/*.*",
    sprite: "src/sprite/**/*.{jpg,jpeg,png}",
    spriteSVG: "src/sprite_svg/*.svg",
    svgico: "src/svgico/*.svg",
    js: "src/js/*.js",
    fonts: "src/fonts/**/*.*",
    svg: "src/svg/**/*.*",
    copy: "src/copy/**/*.*"
  },
  build: {
    root: "build/",
    style: "build/css/",
    fonts: "build/fonts/",
    js: "build/js/",
    img: "build/img/",
    svg: "build/img/svg"
  },
  deploy: {
    root: "www/",
    js: "www/js/",
    style: "www/css/",
    img: "www/img/",
    svg: "www/img/svg",
    fonts: "www/fonts/"
  },
  watch: {
    html: "src/**/*" + (config.pug ? ".pug" : ".html"),
    js: "src/js/**/*.js",
    style: "src/style/**/*.{scss,sass,css}",
    bootstrap: "src/bootstrap/*.+(scss|sass)",
    img: "src/img/**/*.+{jpg,jpeg,png,gif,ico}",
    sprite: "src/sprite/**/*.{jpg,jpeg,png}",
    spriteSVG: "src/sprite_svg/*.svg",
    svg: "src/svg/*.svg",
    svgico: "src/svgico/*.svg",
    favicon: "src/**/*.*",
    fonts: "src/fonts/**/*.*",
    copy: "src/copy/**/*.*"
  }
};

const processors = [
  autoprefixer({
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

function html() {
  return src(path.src.html)
    .pipe(config.pug ? pug() : include())
    .on("error", function(err) {
      console.log(err.message);
      this.emit("end");
    })
    .pipe(dest(path.build.root))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
}
function htmlDeploy() {
  return src(path.src.html)
    .pipe(config.pug ? pug() : include())
    .on("error", function(err) {
      console.log(err.message);
      this.emit("end");
    })
    .pipe(dest(path.deploy.root));
}

function css() {
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
function cssDeploy() {
  return src(path.src.style)
    .pipe(sass().on("error", sass.logError))
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
                test: /\.(js)$/,
                loader: "babel-loader",
                exclude: /(node_modules)/,
                query: {
                  presets: ["@babel/env"],
                  plugins: ["@babel/plugin-proposal-object-rest-spread"]
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
  } else {
    return src(path.src.js)
      .pipe(sourcemaps.init({ largeFile: true }))
      .pipe(include())
      .pipe(
        babel({
          presets: ["@babel/env"]
        })
      )
      .pipe(sourcemaps.write("../maps"))
      .pipe(dest(path.build.js))
      .on("error", function(err) {
        this.emit("end");
      })
      .pipe(
        browserSync.reload({
          stream: true
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
                test: /\.(js)$/,
                loader: "babel-loader",
                exclude: /(node_modules)/,
                query: {
                  presets: ["@babel/env"],
                  plugins: ["@babel/plugin-proposal-object-rest-spread"]
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
      .pipe(dest(path.deploy.js));
  } else {
    return src(path.src.js)
      .pipe(include())
      .pipe(
        babel({
          presets: ["@babel/env"]
        })
      )
      .pipe(dest(path.deploy.js))
      .on("error", function(err) {
        this.emit("end");
      });
  }
}

function sprite(done) {
  if (!config.sprites) return done();

  const options = {
    spritesmith: function(option, sprite) {
      option.imgName = sprite + ".png";
      option.cssName = sprite + ".sass";
      option.imgPath = "../img/" + sprite + ".png";
      option.padding = 10;
      delete option.cssTemplate;
    }
  };
  const spriteData = src(path.src.sprite).pipe(spritesmith(options));
  spriteData.img.pipe(dest(path.build.img));
  spriteData.css.pipe(dest("src/style/libs/")).pipe(
    browserSync.reload({
      stream: true
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
          symbols: "../../preview/symbols.html"
        },
        selector: "%f",
        svg: {
          symbols: "symbols.svg"
        },
        transformData: function(data, config) {
          data.svg.map(function(item) {
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
        }
      })
    )
    .on("error", function(err) {
      this.emit("end");
    })
    .pipe(dest("src/img/svg"));
}

function fico(done) {
  if (!config.fico) return done();
  return src(path.src.svgico)
    .pipe(wait(1000))
    .pipe(svgo())
    .pipe(
      iconfontCss({
        fontName: "fico", // required
        target: "src/style/partials/font-icons.scss",
        targetPath: "../../style/partials/font-icons.scss",
        fontPath: "../fonts/icons/",
        cssClass: "fico"
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
        fontWeight: "normal"
      })
    )
    .on("error", function(err) {
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
  return src(path.src.svg)
    .pipe(svgo())
    .pipe(dest(path.build.svg));
}
function svgDeploy() {
  return src(path.src.svg)
    .pipe(svgo())
    .pipe(dest(path.deploy.svg));
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
  watch(path.watch.html, series(html, reloadBrowser));
  watch(path.watch.style, series(css, reloadBrowser));
  watch(path.watch.js, series(js, reloadBrowser));
  watch(path.watch.fonts, series(fonts, reloadBrowser));
  watch(path.watch.copy, series(copy, reloadBrowser));
  watch(path.watch.img, series(images, reloadBrowser));
  watch(path.watch.svg, series(svg, reloadBrowser));
  if (config.sprites) {
    watch(path.watch.sprite, series(sprite, images, reloadBrowser));
  }
  if (config.spritesSVG) {
    watch(path.watch.spriteSVG, series(spriteSVG, images, reloadBrowser));
  }
  if (config.fico) {
    watch(path.watch.svgico, series(fico, reloadBrowser));
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

exports.html = html;
exports.css = css;
exports.js = js;
exports.fonts = fonts;
exports.push = push;
exports.images = series(
  config.sprites ? sprite : done => done(),
  config.spritesSVG ? spriteSVG : done => done(),
  images
);
exports.default = series(
  clean,
  parallel(html, css, js, fico, fonts, copy, exports.images, svg)
);
exports.deploy = series(
  fico,
  config.sprites ? sprite : done => done(),
  config.spritesSVG ? spriteSVG : done => done(),
  parallel(
    htmlDeploy,
    cssDeploy,
    jsDeploy,
    fontsDeploy,
    copyDeploy,
    imagesDeploy,
    svgDeploy
  )
);

exports.watch = series(exports.default, startServer, watchSource);
