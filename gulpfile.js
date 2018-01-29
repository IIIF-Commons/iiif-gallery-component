const gulp = require('gulp');
const metadata = require('./package');
const tasks = require('gulp-tasks');

tasks.init({
    metadata: metadata,
    libs: [
        'node_modules/base-component/dist/base-component.js',
        'node_modules/extensions/dist/extensions.js',
        'node_modules/jquery-plugins/dist/jquery-plugins.js',
        'node_modules/@iiif/manifold/dist/@iiif/manifold.bundle.js'
    ]
});