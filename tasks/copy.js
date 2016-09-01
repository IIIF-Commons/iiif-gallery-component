var c = require('../gulpfile.config');
var config = new c();
var gulp = require('gulp');
var utils = require('gulp-utils');
var path = require('path');

// gulp.task('copy:bundle', function() {
//     return gulp.src([path.join(config.dist, config.jsBundleOut)].concat(config.examplesDeps)).pipe(gulp.dest(config.examplesDepsDir));
// });

// test unminified js
gulp.task('copy:bundle', function() {
    return gulp.src([path.join(config.dist, config.jsOut)].concat(config.deps).concat(config.examplesDeps)).pipe(gulp.dest(config.examplesDepsDir));
});

gulp.task('copy:css', function() {
    return gulp.src([path.join(config.dist, config.cssOut)]).pipe(gulp.dest(config.examplesCssDir));
});

gulp.task('copy:img', function() {
    return gulp.src(config.imgSrc).pipe(gulp.dest(config.examplesImgDir));
});

gulp.task('copy:typings', function() {
    return gulp.src(config.typings).pipe(gulp.dest(config.typingsDir));
});