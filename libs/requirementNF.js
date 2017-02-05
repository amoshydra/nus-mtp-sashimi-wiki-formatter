const rp = require('request-promise');
const util = require('util');
const config = require('./config');

const api = {
    config: { perPage: 100 },
    head: 'https://api.github.com/repos',
    get repo() { return `${this.head}/${config.name}` },
    get issues() { return `${this.repo}/issues?labels=${config.label.nfr}&per_page=${this.config.perPage}&page=` },
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
    let issueMap = [];
    
    issues.forEach(function(issue) {
        issueMap.push({
            number: issue.number, 
            title: issue.title,
            html_url: issue.html_url
        });
    })

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
    issueMap.forEach(function(issue) {
        appendToMessage(formatIssue(issue));
    });

    appendToMessage('');    
    return messageString;
}

module.exports = requirementPromise;