const rp = require('request-promise');
const util = require('util');
const config = require('./config');

const api = {
    config: { perPage: 100 },
    head: 'https://api.github.com/repos',
    get repo() { return `${this.head}/${config.name}` },
    get issues() { return `${this.repo}/issues?labels=${config.label.fr}&per_page=${this.config.perPage}&page=` },
};

const requestHeader = {
    'Content-Type': 'application/json',
    'User-Agent': 'amoshydra'
}

var numSearchNeeded = 1;

const requirementPromise = function() {
    return rp({ url: api.repo, headers: requestHeader })
    .then(getOpenIssueCount)
    .then(requestAllGitHubIssues)
    .then(categoriseIssues)
    .then(createMarkdown)
    .catch(console.error);
}

function getOpenIssueCount(data) {
    let openIssuesCount = JSON.parse(data).open_issues_count;
    numSearchNeeded = Math.ceil(openIssuesCount/api.config.perPage);
}

function requestAllGitHubIssues() {
    let issuePromises = [];
    for (let pageIndex = 1; pageIndex <= numSearchNeeded; pageIndex++) {
        let newIssuePageRequestPromise = 
            rp({ url: `${api.issues}${pageIndex}`, headers: requestHeader })
            .then(function(rawJsonStr) {
                return JSON.parse(rawJsonStr);
            });
        issuePromises.push(newIssuePageRequestPromise);
    }
    return Promise.all(issuePromises).then(function(jsonArrays) {
        return [].concat.apply([], jsonArrays).reverse();
    });
}

function categoriseIssues(issues) {
    let issueMap = {};

    issues.forEach(function(issue) {
        // 1. Find the longest labels
        let longestLabel = '';
        issue.labels.forEach((label) => {
            if (label.name.length > longestLabel.length) {
                longestLabel = label.name;
            }
        });

        // 2. Parse the label
        // 2.1 Remove pre-string
        const preString = config.label.fr;
        let labelStr = longestLabel.substring(preString.length);
        let labelComposition = labelStr.split(config.labelSplitter);

        let numberOfNesting = labelComposition.length;

        // 2.2 Construct issue map
        let root = issueMap;
        for (let i = 0; i < numberOfNesting; i++) {
            if (i === numberOfNesting - 1) {
                if (!root[labelComposition[i]]) { // exist
                    root[labelComposition[i]] = [];
                }
                root[labelComposition[i]].push({
                    number: issue.number, 
                    title: issue.title,
                    html_url: issue.html_url
                });
            } else {
                if (!root[labelComposition[i]]) { // exist
                    root[labelComposition[i]] = {};
                }
                root = root[labelComposition[i]];
            }
        }
    });

    return issueMap;
}

function createMarkdown(issueMap) {
    let messageString = '';

    // Axullary functions
    function appendToMessage(message) {
        messageString += message + '\n';
    }
    function formatIssue(issue) {
        return `- [#${issue.number}](${issue.html_url}) ${issue.title}`;
    }

    // Construct markdown using issue map
    appendToMessage('Requirements are listed according to their categories. For their completion time, please refer to the [Project\'s milestones](https://github.com/nus-mtp/lecture-note-2.0/milestones?direction=asc&sort=due_date&state=open).');

    // Index level
    Object.keys(issueMap).forEach(function(indexKey, index) {
        let titleNodes = issueMap[indexKey];

        // Title level
        Object.keys(titleNodes).forEach(function(titleKey) {
            appendToMessage(`### ${indexKey}. ${titleKey}`);

            let titleElement = titleNodes[titleKey];
            if (titleElement.constructor === Array) {
                titleElement.forEach(function (issue) {
                    appendToMessage(formatIssue(issue));
                });
            } else {
                Object.keys(titleElement).forEach(function(subKey, subIndex) {
                    appendToMessage(`#### ${indexKey}.${subIndex} ${subKey}`);

                    let subElement = titleElement[subKey];
                    if (subElement.constructor === Array) {
                        subElement.forEach(function (issue) {
                            appendToMessage(formatIssue(issue));
                        });
                    }
                    appendToMessage('');
                });
            }

            appendToMessage('');        
        });
    });
    return messageString;
}

module.exports = requirementPromise;