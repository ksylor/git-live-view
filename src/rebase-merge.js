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


async function getRebaseState(repoPath) {
    const repo = await utils.openRepo(repoPath);

    // get the rebase command text file which will give us a list of
    // the effected commits
    const todoFileContents = await readFileAsync(repoPath + FILE_REBASE_TODO, {encoding: 'utf8'});

    // get the reference for the branch that is rebasing
    const rebaseHeadFileContents = await readFileAsync(repoPath + FILE_REBASE_ORIG_HEAD, {encoding: 'utf8'});
    const rebaseHeadNameFileContents = await readFileAsync(repoPath + FILE_REBASE_HEAD_NAME, {encoding: 'utf8'});
    // get the onto commit sha
    const ontoFileContents = await readFileAsync(repoPath + FILE_REBASE_ONTO, {encoding: 'utf8'});

    if (rebaseHeadFileContents.trim() === ontoFileContents.trim()) {
        // not sure if you'd get into this state?
        console.log('wtf are you even rebasing bro??');
    }

    // get a list of affected commits
    const affectedCommits = await Promise.all(todoFileContents.split('\n')
        .filter(line => line.charAt(0) !== '#' && line.length > 0)
        .map(async function(line) {
            let chunks = line.split(' ');
            let commit = await nodegit.AnnotatedCommit.fromRevspec(repo, chunks[1]);
            return {
                action: chunks[0],
                commit: commit.id(),
            };
        }));

    console.log(affectedCommits);

    // try to figure out what branch the onto commit is part of.
    // is it the head of another branch or is the rebase branch
    // getting rebased against itself?
    const rebaseHeadCommit = await nodegit.Commit.lookup(repo, rebaseHeadFileContents.trim());
    const rebaseBranch = await nodegit.Reference.lookup(repo, rebaseHeadNameFileContents.trim());
    const ontoCommit = await nodegit.Commit.lookup(repo, ontoFileContents);

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

    let isSelfRebase = false;

    // if the rebase isn't onto a branch reference, check and see
    // if the onto commit is happening in the rebased branch
    // aka the branch is getting rebased against itself
    if (!ontoBranch) {
        // rebase is happening on a random commit :(
        // check and see if it's in the current branch
        const foundIndex = await utils.searchHistoryForCommit(repo, rebaseHeadCommit, ontoCommit.id());
        if (foundIndex >= 0) {
            isSelfRebase = true;

            let branchHistory = await branches.getNormalizedSingleBranchHistory(repo, rebaseHeadCommit, rebaseBranch, foundIndex + 3);

            // now that we have history, we need to find the affected commits and tag them
            affectedCommits.forEach(function (affectedCommit) {
                for (let i = 0; i < branchHistory.local.history.length; i++) {
                    let historyCommit = branchHistory.local.history[i];
                    if (affectedCommit.commit.equal(historyCommit.sha)) {
                        historyCommit.isRebasingCommit = true;
                        historyCommit.rebaseAction = affectedCommit.action;
                        break;
                    }
                }
            });

            // finally tag the onto commit
            branchHistory.local.history[foundIndex].isRebaseOnto = true;

            return { isRebase: true, isMultiBranch: false, ...branchHistory };
        }
    }

    if (ontoBranch) {
        return { isRebase:true, isMultiBranch: true }
    }

    if (!ontoBranch && !isSelfRebase) {
        //idk what you are doing
        console.log("rebase target branch not found?");
    }

    return { isRebase: true };
}

module.exports = {
    getRebase: getRebaseState,
};