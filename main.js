const requirementF = require('./libs/requirementF');
const requirementNF = require('./libs/requirementNF');
const sidebar = require('./libs/sidebar');
const config = require('./libs/config');
const fsp = require('fs-promise');

// Write sidebar
sidebar()
.then(data => {
    writeTo(data, config.filePath.sidebar);
});

// Write requirements
requirementF()
.then(data => {
    writeTo(data, config.filePath.fr);
});

requirementNF()
.then(data => {
    writeTo(data, config.filePath.nfr);
});

function writeTo(data, filename) {
    filename = `dist/${filename}`
    return fsp.writeFile(filename, data);
}