# gulp-rewrite-imports

A gulp plugin which allows to rewrite `import` and `require` statements in JavaScript and TypeScript files.

## Install

The plugin can be installed as follows:

Yarn:

```
yarn add --dev gulp-rewrite-imports
``` 

NPM:

```
npm install --save-dev gulp-rewrite-imports
```

## Basic usage

```
const { src, dest } = require('gulp');
const rewriteImports = require('gulp-rewrite-imports');

src('./src/**/*.js')
    .pipe(rewriteImports({
        mappings: {
            'some-module-name': 'another-module-name',
            'foo', {
                path: './some/nested/file/bar.js',
                relative: true,
            },
        },
    })
    .pipe(dest('./dist'));
```
