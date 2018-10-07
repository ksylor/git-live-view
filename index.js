const nodegit = require("nodegit");
const path = require("path");

// let's start out by getting the history of the HEAD branch

const pathToRepo = path.resolve("../ohshitgit");
var walker;

// first we open the repo in order to interact with it
nodegit.Repository.open(pathToRepo)
    .then(function(repo) {
        // create the walker and save it for later
        walker = nodegit.Revwalk.create(repo);
        console.log(repo.path());
        // get the commit at HEAD so we can work backwards from that
        return repo.getHeadCommit();
    }).then(function(commit) {
        // walk back down the tree from the head commit backwards
        console.log("head: " + commit.sha());
        walker.sorting(nodegit.Revwalk.SORT.TIME);
        walker.push(commit.id());
        return walker.getCommits(10);
    }).then(function (commits) {
        // note the head commit is repeated in the list, we can skip it
        // but for now just keep it
        commits.forEach(function(commit) {
           console.log(commit.sha());
        });
    }).catch(function (err) {
        console.log(err);
    });