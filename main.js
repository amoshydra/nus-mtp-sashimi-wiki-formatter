const requirementF = require('./libs/requirementF');
const requirementNF = require('./libs/requirementNF');
const fs = require('fs');

fs.writeFile('requirements.md', '');

requirementNF
.then(appendFile)

.then(() => requirementF)
.then(appendFile);

function appendFile(data) {
    fs.appendFile('requirements.md', data);
}