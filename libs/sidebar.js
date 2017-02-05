const fsp = require('fs-promise');
const config = require('./config');
const util = require('util');

const markdownFilenamePattern = /(\d\.\d?) (.*)\.md/;

let sidebar = function() {
    const folderToCheck = config.wikiPath;

    return fsp.readdir(folderToCheck)
    .then(buildFileTree)
    .then(generateMarkdown)
    .catch(console.error);
}

module.exports = sidebar;


function buildFileTree(files) {
    let fileTree = {};
    files.forEach(file => {
        let filename = file.replace(/-/g, ' ');
        let filepath = file.substring(0, file.length - 3);
        let matches = filename.match(markdownFilenamePattern);
        if (matches) {
            let headingPath = `https://github.com/${config.name}/wiki/${filepath}`;
            let headingIndex = matches[1];
            let headingTitle = matches[2];
            let headingIndices = headingIndex.split('.')
                                             .filter((element, index) => {
                                                return parseInt(element, 10);
                                             });

            // Create tree structure
            let parent = null;
            let root = fileTree;
            headingIndices.forEach((index, pos) => {
                if (!root[index]) {
                    root[index] = {
                        child: {}
                    };
                }

                parent = root[index];
                root = root[index].child;
            });

            // Insert node
            parent.heading = {
                title: headingTitle,
                path: headingPath,
                index: headingIndex,
                indices: headingIndices
            };
        }
    });

    return fileTree;
};

function generateMarkdown(fileTree) {
    let messageString = '';
    function appendToMessage(message) {
        messageString += message + '\n';
    }

    // Header
    appendToMessage('## 📄 Contents');
    appendToMessage('');
    appendToMessage('<ol>');

    // Content
    let root = fileTree;
    Object.keys(root).forEach(key => {
        let elementNode = root[key];
        let nodeChild = root[key].child;

        appendToMessage(getHeaderTemplate(elementNode.heading));

        Object.keys(nodeChild).forEach(key => {
            let elementNode = nodeChild[key];
            appendToMessage(getHeader2Template(elementNode.heading));
        })
        appendToMessage('  <br>');

    });

    // Footer
    appendToMessage('</ol>');

    // Return data
    return messageString;

    // Auxilary functions
    function getHeaderTemplate(node) {
        return (
`  <a href="${node.path}">
    <li>
      <strong>${node.title}<strong>
    </li>
  </a>`)
    }

    function getHeader2Template(node) {
        return (
`  <a href="${node.path}">
    ${node.index} ${node.title}
  </a><br>`)
    }
}
