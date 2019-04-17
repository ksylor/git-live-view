const nodegit = require('nodegit');
const utils = require("./utils");
const branches = require('./branches');
const files = require('./files');

const {promisify} = require('util');
const fs = require('fs');
const readFileAsync = promisify(fs.readFile);

const FILE_REBASE_TODO = '/.git/rebase-merge/git-rebase-todo';
const FILE_REBASE_HEAD_NAME = '/.git/rebase-merge/head-name';
const FILE_REBASE_ONTO = '/.git/rebase-merge/onto';
const FILE_REBASE_ORIG_HEAD = '/.git/rebase-merge/orig-head';

const FILE_MERGE_HEAD = '/.git/MERGE_HEAD';
const FILE_MERGE_MSG = '/.git/MERGE_MSG';

const DEFAULT_SETTINGS = {
    showWithMaster: false,
    commitsToDisplay: 8,
    mergedHistoryLength: 3,
};

let SETTINGS = DEFAULT_SETTINGS;

function getFiles(repoPath) {
    // make sure all the rebase files exist before we query them.
    const rebaseHeadFile = fs.existsSync(repoPath + FILE_REBASE_ORIG_HEAD);
    const rebaseHeadNameFile = fs.existsSync(repoPath + FILE_REBASE_HEAD_NAME);
    const ontoFile = fs.existsSync(repoPath + FILE_REBASE_ONTO);
    const todoFile = fs.existsSync(repoPath + FILE_REBASE_TODO);

    return rebaseHeadFile && rebaseHeadNameFile && ontoFile && todoFile;
}


async function getRebaseState(repoPath, settings) {
    const repo = await utils.openRepo(repoPath);

    // make sure all the files exist before we try to rebase
    let foundAllFiles = false;
    let tries = 1;
    while(!foundAllFiles && tries < 10) {
        console.log('waiting');
        tries++;
        foundAllFiles = getFiles(repoPath); }

    // get the reference for the branch that is rebasing
    const rebaseHeadFileContents = await readFileAsync(repoPath + FILE_REBASE_ORIG_HEAD, {encoding: 'utf8'});
    const rebaseHeadNameFileContents = await readFileAsync(repoPath + FILE_REBASE_HEAD_NAME, {encoding: 'utf8'});
    // get the onto commit sha
    const ontoFileContents = await readFileAsync(repoPath + FILE_REBASE_ONTO, {encoding: 'utf8'});
    // get the rebase command text file which will give us a list of
    // the effected commits
    const todoFileContents = await readFileAsync(repoPath + FILE_REBASE_TODO, {encoding: 'utf8'});

    if (rebaseHeadFileContents.trim() === ontoFileContents.trim()) {
        // not sure if you'd get into this state?
        console.log('wtf are you even rebasing bro??');
    }

    // try to figure out what branch the onto commit is part of.
    // is it the head of another branch or is the rebase branch
    // getting rebased against itself?
    const rebaseHeadCommit = await nodegit.Commit.lookup(repo, rebaseHeadFileContents.trim());
    const rebaseBranch = await nodegit.Reference.lookup(repo, rebaseHeadNameFileContents.trim());
    const ontoCommit = await nodegit.Commit.lookup(repo, ontoFileContents);

    // check and see if the commit is in the current branch
    const foundIndex = await utils.searchHistoryForCommit(repo, rebaseHeadCommit, ontoCommit.id());
    if (foundIndex >= 0) {
        let branchHistory = await branches.getNormalizedSingleBranchHistory(repo, rebaseHeadCommit, rebaseBranch, foundIndex + 3, true, settings);

        // tag the affected commits
        branchHistory.local.history = await setAffectedCommits(repo, todoFileContents, branchHistory.local.history);

        // finally, tag the onto commit
        branchHistory.local.history[foundIndex].isRebaseOnto = true;

        return { isRebase: true, isMultiBranch: false, ...branchHistory };
    }

    // if the commit isn't in the current branch already,
    // check to see if it's the tip of another branch
    const ontoBranch = await repo.getReferences(nodegit.Reference.TYPE.LISTALL).then(function(refarray) {
        // filter out refs that are not branches
        const branches = refarray.filter(ref => ref.isBranch || ref.isRemote);

        let found;
        // search through the list of branches to see if the onto
        // commit is the tip of any branch
        branches.some(function(ref) {
            if (ontoCommit.id().equal(ref.target())) {
                found = ref;
                return true;
            }
            return false;
        });
        return found;
    });

    if (ontoBranch) {
        // get merged history of both branches
        const history = await branches.getMultiBranchLocalAndRemoteHistory(repo,
            ontoBranch, ontoCommit, rebaseBranch, rebaseHeadCommit, false, settings);

        // tag the affected commits in the rebasing branch
        // which is always the second branch returned
        history.local.branches[1].history = await setAffectedCommits(repo, todoFileContents, history.local.branches[1].history);

        // finally, tag the onto commit
        history.local.branches[0].history[0].isRebaseOnto = true;

        if (!history.remote) {
            // check if there is a remote branch with the same name that is just untracked.
            // if there isnt' a remote branch, don't bother showing the remote master
            history.remote = {};
            history.remote.msg = await branches.checkForUntrackedRemote(repo, rebaseBranch);
            history.remote.branchName = utils.getShortBranchName(rebaseBranch.name());
        }

        return { isRebase:true, isMultiBranch: true, ...history }
    }

    // if we get here something is fucked
    //idk what you are doing
    console.log("rebase target branch not found?");
    return { msg: "everything is fucked idk sorry" };
}

/**
 * add rebasing info to the affected commits.
 * @param todoFileContents
 * @param branchHistory
 * @returns {Promise<void>}
 */
async function setAffectedCommits(repo, todoFile, branchHistory){
    const lines = todoFile.split('\n').filter(line => line.charAt(0) !== '#' && line.length > 0);
    // get a list of affected commits
    const affectedCommits = await Promise.all(
        lines
        .map(async function(line) {
            let chunks = line.split(' ');
            let commit = await nodegit.AnnotatedCommit.fromRevspec(repo, chunks[1]);
            return {
                action: chunks[0],
                commit: commit.id(),
            };
        }));

    // now that we have history, we need to find the affected commits and tag them
    affectedCommits.forEach(function (affectedCommit) {
        for (let i = 0; i < branchHistory.length; i++) {
            let historyCommit = branchHistory[i];
            if (affectedCommit.commit.equal(historyCommit.sha)) {
                historyCommit.isRebasingCommit = true;
                historyCommit.rebaseAction = affectedCommit.action;
                break;
            }
        }
    });

    return branchHistory;
}

module.exports = {
    getRebase: getRebaseState,
};