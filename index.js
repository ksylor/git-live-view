const nodegit = require("nodegit");
const path = require("path");

// let's start out by getting the history of the HEAD branch

function getHeadHistory(repoPath) {
    repoPath = repoPath || "../ohshitgit";
    const pathToRepo = path.resolve(repoPath);
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
}

//getHeadHistory();

// get the status of the working directory
function getStatus(repoPath) {
    repoPath = repoPath || "../ohshitgit";
    const pathToRepo = path.resolve(repoPath);

    nodegit.Repository.open(pathToRepo).then(function(repo) {
        console.log(repo.path);

        repo.getStatus().then(function (statuses) {
            let index = statuses.filter(file => file.inIndex());

            let working = statuses.filter(file => file.inWorkingTree());

            index.forEach(function (file) {
                console.log("index: " + file.path() + " " + file.status());
            });

            working.forEach(function (file) {
               console.log("workspace: " + file.path() + " " + file.status());
            });
        });
    }).catch(function (err) {
        console.log(err);
    });
}

//getStatus();

function getRemote(repoPath) {
    repoPath = repoPath || "../ohshitgit";
    const pathToRepo = path.resolve(repoPath);
    var currRepo;

    nodegit.Repository.open(pathToRepo).then(function (repo) {
        currRepo = repo;
        return repo.getCurrentBranch();
    }).then(function (branch) {
        //console.log(branch.shorthand());
        console.log(branch.remoteName());
    });
}

getRemote();