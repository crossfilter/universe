var gulp = require('gulp');

var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var bump = require('gulp-bump');
var mocha = require('gulp-mocha');
var cover = require('gulp-coverage');

var testFiles = [
  'universe.js',
  'test/**/*.spec.js'
];

gulp.task('scripts', function() {
  return browserify('./src/universe.js', {
      standalone: 'universe',
      debug: true
    })
    .bundle()
    .pipe(source('universe.js'))
    .pipe(gulp.dest('./'))
    .pipe(rename('universe.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./'));
});

gulp.task('docs', function() {
  // Set up gitdown
  // Gitdown.notice = function () { return ''; };
  // var gitdown = Gitdown.read('docs/README.md');
  // var config = gitdown.config;
  // config.gitinfo.gitPath = './docs';
  // gitdown.config = config;

  // return gitdown
  // 	.write('README.md');
});

gulp.task('bump', function() {
  gulp.src(['./bower.json', './package.json'])
    .pipe(bump({
      type: 'minor'
    }))
    .pipe(gulp.dest('./'));
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', ['scripts']);
  gulp.watch('./docs/*', ['docs']);
});

gulp.task('test', function() {
  return gulp.src(testFiles, {
      read: false
    })
    // .pipe(cover.instrument({
    //   pattern: ['src/**/*.js'],
    //   debugDirectory: 'debug'
    // }))
    .pipe(mocha({
      reporter: 'nyan'
    }))
    // .pipe(cover.gather())
    // .pipe(cover.format())
    // .pipe(gulp.dest('coverage'));
});

// Watch Files For Changes
gulp.task('testWatch', function() {
  gulp.watch(testFiles, ['test']);
  gulp.watch('universe.js', ['test']);
})

gulp.task('default', ['scripts', 'docs', 'testWatch', 'watch']);
gulp.task('all', ['scripts', 'docs', 'test']);
