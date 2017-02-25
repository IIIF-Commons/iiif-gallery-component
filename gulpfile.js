const gulp = require('gulp');
const metadata = require('./package');
const tasks = require('gulp-tasks');

tasks.init({
    metadata: metadata,
    // libs that MUST be included in a consuming app for this component to work
    libs: [
        'node_modules/base-component/dist/base-component.js',
        'node_modules/extensions/dist/extensions.js',
        'node_modules/jquery-plugins/dist/jquery-plugins.js',
        'node_modules/manifold/dist/manifold.bundle.js'
    ],
    // libs that MAY be included in a consuming app but are used here for example purposes
    examples: []
});