const gulp = require('gulp');
const metadata = require('./package');
const tasks = require('gulp-tasks');

tasks.init({
    metadata: metadata,
    // libs that MUST be included in a consuming app for this component to work
    libs: [
        'node_modules/base-component/dist/base-component.bundle.js',
        'node_modules/jquery-plugins/dist/jquery-plugins.js',
        'node_modules/manifold/dist/manifold.bundle.js'
    ],
    // libs that MAY be included in a consuming app but are used here for example purposes
    examples: [],
    // ts definitions to copy to the 'typings' dir
    typings: [
        'node_modules/base-component/dist/base-component.d.ts',
        'node_modules/base-component/typings/corejs.d.ts',
        'node_modules/base-component/typings/jquery.d.ts',
        'node_modules/base-component/typings/node.d.ts',
        'node_modules/manifold/dist/manifold.bundle.d.ts'
    ]
});