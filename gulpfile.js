const { dest, parallel, series, src, task } = require('gulp');
const ts = require('gulp-typescript');
const filter = require('gulp-filter');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const tsProject = ts.createProject('tsconfig.json', {
    noEmit: false,
});

task('recreate_dist', function (cb) {
    rimraf('dist', {}, function (err) {
        if (err) {
            cb(err);
            return;
        }
        setTimeout(() => fs.mkdir('dist', cb), 100);
    });
});

task('tsc', function() {
    return tsProject
        .src()
        .pipe(tsProject())
        .pipe(filter(['**', '!**/*.spec.d.ts', '!**/*.spec.js']))
        .pipe(dest('dist'));
});

task('package_json', function (cb) {
    fs.readFile('package.json', { encoding: 'utf8' }, function (readErr, data) {
        if (readErr) {
            cb(readErr);
            return;
        }
        const json = JSON.parse(data);
        delete json.devDependencies;
        delete json.scripts;
        json.main = 'index.js';
        json.types = 'index.d.ts';
        fs.writeFile(path.join('dist', 'package.json'), JSON.stringify(json, null, 2), { encoding: 'utf8' }, cb);
    });
});

task('copy_license', function () {
    return src('LICENSE').pipe(dest('./dist'));
});

task('copy_readme', function () {
    return src('README.md').pipe(dest('./dist'));
});

exports.default = series(
    'recreate_dist',
    parallel(
        'tsc',
        'package_json',
    ),
    parallel(
        'copy_license',
        'copy_readme',
    ),
);
