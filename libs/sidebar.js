const util = require('util');
const fsp = require('fs-promise');

let sidebar = function() {
    const folderToCheck = '../lecture-note-2.0.wiki/';
    fsp.readdir(folderToCheck, (err, files) => {
        let fileList = [];
        files.forEach(file => {
            console.log(file);
            fileList.push(file);
        });
    });
}

module.exports = sidebar;