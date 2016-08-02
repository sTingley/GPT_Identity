var gulp = require('gulp');
var browserify = require('gulp-browserify');

var script = "index.js";

gulp.task('scripts', function() {
  // Minify and copy all JavaScript (except vendor scripts) 
  // with sourcemaps all the way down 
  return gulp.src(script)
    .pipe(browserify())
    .pipe(gulp.dest('/Applications/XAMPP/xamppfiles/htdocs/wallet/build/js'));
});

gulp.task('watch', function() {
  gulp.watch(script, ['scripts']);
});
 
// The default task (called when you run `gulp` from cli) 
gulp.task('default', ['watch', 'scripts']);
