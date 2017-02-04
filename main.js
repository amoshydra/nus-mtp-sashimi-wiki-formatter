const requirementF = require('./libs/requirementF');
const requirementNF = require('./libs/requirementNF');
var fsp = require('fs-promise');

// Write requirements
requirementNF()
.then((data) => {
    writeTo(data, '3.1-Non-functional-Requirements.md');
});

// Write requirements
requirementF()
.then((data) => {
    writeTo(data, '3.2-Functional-Requirements.md');
});

function writeTo(data, filename) {
    filename = `dist/${filename}`
    return fsp.writeFile(filename, data);
}