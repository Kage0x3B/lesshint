'use strict';

const gulp = require('gulp');

gulp.task('lint', () => {
    const eslint = require('gulp-eslint');

    return gulp.src(['./lib/**/*.js', './test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', ['lint'], () => {
    const mocha = require('gulp-mocha');
    const options = {
        read: false
    };

    return gulp.src(['./test/specs/**/*.js', '!./test/specs/util.js'], options)
        .pipe(mocha());
});

gulp.task('coveralls', ['test'], () => {
    const coveralls = require('gulp-coveralls');

    return gulp.src('./coverage/lcov.info')
        .pipe(coveralls());
});

gulp.task('watch', () => {
    gulp.watch(['./test/**/*.js', './lib/**/*.js'], ['test']);
});

gulp.task('default', ['test']);
