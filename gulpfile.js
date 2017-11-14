/// <binding AfterBuild='build' Clean='clean' />
var gulp = require('gulp');
var tslint = require('gulp-tslint');
var exec = require('child_process').exec;
var mocha = require('gulp-mocha');
var gulp = require('gulp-help')(gulp);
var path = require('path');
var del = require('del');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');

var tslintCustom = require('tslint'); // for tslint-next https://github.com/panuhorsmalahti/gulp-tslint#specifying-the-tslint-module
require('dotbin');

var tsFilesGlob = (function (c) {
  return c.filesGlob || c.files || 'src/**/*.ts';
})(require('./tsconfig.json'));

gulp.task('clean', 'Cleans the generated js files from lib directory', function () {
  return del([
    './exe/**/*',
  ]);
});

gulp.task('lint', 'Lints all TypeScript source files', function () {
  return gulp.src(tsFilesGlob)
    .pipe(tslint({
      tslint: tslintCustom,
      formatter: 'verbose'
    }))
    .pipe(tslint.report());
});

gulp.task('build', 'Compiles all TypeScript source files', ['lint'], function (cb) {
  exec('tsc --version', function (err, stdout, stderr) {
    console.log('Using TypeScript ', stdout);
    if (stderr) {
      console.log(stderr);
    }
  });

  var tsProject = ts.createProject(path.resolve('./tsconfig.json'));
  var tsResult = gulp.src(path.resolve('./src/**/*.ts'))
      .pipe(sourcemaps.init())
      .pipe(tsProject());
    return merge([
        tsResult.dts.pipe(gulp.dest('./exe/')),
        tsResult.js
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(path.resolve('./exe/')))
    ]);


  /*
  return exec('tsc', function (err, stdout, stderr) {
    console.log(stdout);
    if (stderr) {
      console.log(stderr);
    }
    cb(err);
  });
  */
});

gulp.task('test', 'Runs the Jasmine test specs', ['build'], function () {
  return gulp.src('./exe/test/**/*.spec.js')
    .pipe(mocha({
      reporter: 'spec'
    }));
});

gulp.task('watch', 'Watches ts source files and runs build on change', function () {
  gulp.watch(tsFilesGlob, ['build', 'test']);
});
