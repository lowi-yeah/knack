import gulp from "gulp"
import cp from "child_process"
import gutil from "gulp-util"
import postcss from "gulp-postcss"
import cssnext from "postcss-cssnext"
import BrowserSync from "browser-sync"
import webpack from "webpack"
import webpackConfig from "./webpack.conf"

// import semanticWatch  from './src/lib/semantic/tasks/watch'
import semanticBuild  from './semantic/tasks/build'
import semanticJS     from './semantic/tasks/build/javascript'
import semanticCSS    from './semantic/tasks/build/css'
import semanticAssets from './semantic/tasks/build/assets'

const browserSync = BrowserSync.create();
const hugoBin     = "hugo";
const defaultArgs = ["-d", "../dist", "-s", "site", "-v"];

gulp.task('semantic-ui', semanticBuild);
gulp.task('semantic-js', semanticJS);
gulp.task('semantic-css', semanticCSS);
gulp.task('semantic-assets', semanticAssets);

gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, ["--buildDrafts", "--buildFuture"]));

gulp.task("build", ['semantic-ui', 'webpack', 'hugo']);
gulp.task("build-preview", ['semantic-ui', 'webpack', 'hugo-preview']);


gulp.task('webpack', (cb) => {
  const myConfig = Object.assign({}, webpackConfig)
  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError('webpack', err)
    gutil.log('[webpack]', stats.toString({ colors: true, progress: true }))
    browserSync.reload()
    cb() })})

gulp.task('server', ['hugo', 'semantic-ui', 'webpack'], () => {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })

  gulp.watch('./src/js/**/*', ['webpack'])
  gulp.watch(['./src/less/**/*'], ['webpack'])
  gulp.watch('./semantic/src/**/*.{less,overrides,variables,config}', ['semantic-css'])
  gulp.watch('./semantic/src/**/*.js', ['semantic-js'])
  gulp.watch('semantic-json', ['semantic-js', 'semantic-css'])
  
  gulp.watch('./site/**/*', ['hugo'])
});

function buildSite(cb, options) {
  const args = options ? defaultArgs.concat(options) : defaultArgs;

  return cp.spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
