const { src, dest, parallel } = require("gulp");

const pug = require("gulp-pug");

const config = {
  pug: true
};

const path = {
  src: {
    html: "src/*" + (config.pug ? ".pug" : ".html")
  }
};

function html() {
  return src(path.src.html)
    .pipe(pug())
    .pipe(dest("build/"));
}

exports.html = html;
exports.default = parallel(html);
