# iiif-gallery-component

> IMPORTANT: This repository has been archived due to lack of adoption, and the need to modernize technology. For now, this component has been reintegrated into the [Universal Viewer project](https://github.com/UniversalViewer/universalviewer). Please note that the UV community remains interested in sharing our work with the broader IIIF community, but we need to find a more sustainable way of achieving this goal (such as, perhaps, a monorepo approach to the existing UV repository). If you need to use this component, or if you have ideas about better ways of sharing in the future, please reach out to us. See the [UV README](https://github.com/UniversalViewer/universalviewer) for current methods to contact the UV community.

## Getting started

    npm i
    npm run build
    npm start

This will launch a demo on http://localhost:3000/examples that you can use for interactive testing.

## Making a release

First decide on a new version number (x.y.z) using [semantic versioning](https://semver.org/). Then run these commands, being sure to substitute the real version number for x.y.z below:

    npm i
    npm version x.y.z
    npm publish
