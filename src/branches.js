const nodegit = require("nodegit");
const utils = require("./utils");

// TODO: make this configurable in settings?
const COMMITS_TO_DISPLAY = 8;
const MERGED_HISTORY_LENGTH = 3;

/**
 * It's possible to push up a branch to remote without also
 * setting it up as a tracking branch, check for that state
 * @param repo
 * @param localBranchWitNoRemote
 * @returns {Promise<string>} representing the type of missing remote
 */
async function checkForUntrackedRemote(repo, localBranchWitNoRemote) {
    // branch name will be in the format refs/heads/branch_name,
    // switch to the refs/remotes/origin/branch_name to get the remote version
    // TODO how to handle remotes other than origin?
    const remoteName = localBranchWitNoRemote.name().replace('heads', 'remotes/origin');

    return await nodegit.Reference.nameToId(repo, remoteName)
        .then(function(remote) {
            return "MSG_UNTRACKED_REMOTE";
        }).catch(function(err) {
            return "MSG_NO_REMOTE";
        });
}

/**
 * Very rough way to determine the difference between local and
 * remote branches - return how far "ahead" remote and local are e.g. how many unique commits.
 * @param repo
 * @param localHead
 * @param remoteHead
 * @returns {Promise<{remoteAhead: number, localAhead: number}>}
 */
async function getDifferenceBetweenLocalRemote(repo, localHead, remoteHead) {
    if (localHead.id().equal(remoteHead.id())) {
        return { localAhead: 0, remoteAhead: 0 };
    }

    const mergeBase = await nodegit.Merge.base(repo, localHead, remoteHead);

    // how many commits back do we go in order to find the merge base?
    const partialRemoteHistory = await utils.getHistoryUntil(repo, remoteHead, mergeBase);
    const partialLocalHistory = await utils.getHistoryUntil(repo, localHead, mergeBase);

    // how far ahead of merge base are local and remotes?
    // damn zero indexed arrays
    const localAheadBy = Math.max(0, partialLocalHistory.length - 1);
    const remoteAheadBy = Math.max(0, partialRemoteHistory.length - 1);

    return { localAhead: localAheadBy, remoteAhead: remoteAheadBy };
}

/**
 * gets the history of the local branch and it's remote upstream branch
 * going back specified number of commits
 *
 * Note: this will normalize the number of commits so that commits in common
 * will be even with each other in the UI
 * @param repo
 * @param localHead
 * @param localBranch
 * @param numCommits
 * @returns {Promise<Array<Commit>>}
 */
async function getNormalizedSingleBranchHistory(repo, localHead, localBranch, numCommits) {
    // get the corresponding upstream reference
    const remoteBranch = await utils.getRemote(localBranch);

    let localHistory;
    let remoteHistory;
    let noRemoteMsg;
    let localAheadBy = 0;
    let remoteAheadBy = 0;

    // default to showing the default number of commits
    let goBackLocal = numCommits;
    let goBackRemote = numCommits;

    // if there is a remote branch, get info about that
    if (remoteBranch) {
        // get the tip commit of the remote branch
        let remoteHead = await repo.getReferenceCommit(remoteBranch);

        // calculate how many commits to display so that the merge base commit
        // is on the same line in both local and remote
        let { localAhead, remoteAhead } = await getDifferenceBetweenLocalRemote(repo, localHead, remoteHead);

        localAheadBy = localAhead;
        remoteAheadBy = remoteAhead;

        if (localAheadBy > 0 || remoteAheadBy > 0) {
            // how far back does each branch need to go to be vertically aligned correctly?
            // this calculation took me a while, but basically figure out the
            // difference in commits and subtract that from the max number of commits,
            // but don't go higher than the max number of commits
            goBackLocal = Math.min((numCommits - (remoteAheadBy - localAheadBy)), numCommits);
            goBackRemote = Math.min((numCommits - (localAheadBy - remoteAheadBy)), numCommits);
        }

        // get the history for remote, going back by the normalized number
        remoteHistory = await utils.getHistory(repo, remoteHead, goBackRemote);

        // get the history for local, going back by the normalized number
        localHistory = await utils.getHistory(repo, localHead, goBackLocal);
    } else {
        // there's no remote so just get the local history back by the max number of commits
        localHistory = await utils.getHistory(repo, localHead, numCommits);

        // check if there is a remote branch with the same name that is just untracked.
        noRemoteMsg = await checkForUntrackedRemote(repo, localBranch);
    }

    return {
        'isMultiBranch' : false,
        'local': {
            'branchName': utils.getShortBranchName(localBranch.name()),
            'history': utils.getCommitHistory(localHistory, localAheadBy),
        },
        'remote' : {
            'msg': noRemoteMsg,
            'branchName': remoteBranch ? utils.getShortBranchName(remoteBranch.name()) : utils.getShortBranchName(localBranch.name()),
            'history': remoteHistory ? utils.getCommitHistory(remoteHistory, remoteAheadBy) : null,
        }
    };
}

/**
 * Gets the merged history of two different branches in the same environment
 * assumption is that the branches _do_ have a merge_base at some point!
 *
 * Will return the history of both branches back until the merge_base as separate
 * data structures, then returns the merged branch history up to MERGED_HISTORY_LENGTH
 *
 * @param repo
 * @param branchOneHead
 * @param branchOneBranch
 * @param branchOneAheadBy
 * @param branchTwoHead
 * @param branchTwoBranch
 * @param branchTwoAheadBy
 * @returns {Promise<{merged: *, branches: {branchName: string, history: *}[], isMultiBranch: boolean}|Array>}
 */
async function getMultiBranchHistory(
    repo,
    branchOneHead,
    branchOneBranch,
    branchOneAheadBy,
    branchTwoHead,
    branchTwoBranch,
    branchTwoAheadBy
) {
    if (branchOneHead.id().equal(branchTwoHead.id())) {
        // both branches point to the same commit
        // TODO: fix this to return something
        return [];
    }

    const mergeBase = await nodegit.Merge.base(repo, branchOneHead, branchTwoHead);

    const branchOneHistory = await utils.getHistoryUntil(repo, branchOneHead, mergeBase);
    const branchTwoHistory = await utils.getHistoryUntil(repo, branchTwoHead, mergeBase);

    // the walker includes the merge base commit in the history so we have to remove it
    // from each branch because we want it to be in the merged group
    branchOneHistory.pop();
    branchTwoHistory.pop();

    const mergeCommit = await nodegit.Commit.lookup(repo, mergeBase);
    const mergedHistory = await utils.getHistory(repo, mergeCommit, MERGED_HISTORY_LENGTH);

    return {
        'isMultiBranch': true,
        'branches': [
            {
                'branchName': utils.getShortBranchName(branchOneBranch.name()),
                'history': utils.getCommitHistory(branchOneHistory, branchOneAheadBy),
            },
            {
                'branchName': utils.getShortBranchName(branchTwoBranch.name()),
                'history': utils.getCommitHistory(branchTwoHistory, branchTwoAheadBy),
            }
        ],
        'merged': utils.getCommitHistory(mergedHistory, 0),
    };
}

/**
 * gets the history for two branches from both local and remote environments
 * Branch one will be on the left of the screen so make that master
 * assumes that the branches do have a shared history!
 *
 * This will abort getting remote history if any of the branches passed in do not have
 * remote history. will leave it up to calling function to determine what to do.
 *
 * @param repo
 * @param branchOne
 * @param branchOneHead
 * @param branchTwo
 * @param branchTwoHead
 * @returns {Promise<{remote: {msg: string}, local: ({merged: *, branches: {branchName: string, history: *}[], isMultiBranch: boolean}|Array)}>}
 */
async function getMultiBranchLocalAndRemoteHistory(repo, branchOne, branchOneHead, branchTwo, branchTwoHead) {
    let branchOneRemoteAheadBy = 0;
    let branchOneLocalAheadBy = 0;

    let branchTwoRemoteAheadBy = 0;
    let branchTwoLocalAheadBy = 0;

    let noRemoteMsg;
    let remoteHistory;

    // get the corresponding upstream reference for each branch
    const branchOneRemote = await utils.getRemote(branchOne);
    let branchTwoRemote = await utils.getRemote(branchTwo);

    if (branchOneRemote && branchTwoRemote) {
        // get the remote branch head
        let branchOneRemoteHead = await nodegit.Commit.lookup(repo, branchOneRemote.target());

        // get difference in commits local vs. remote for current branch
        let branchOneAheadBy = await getDifferenceBetweenLocalRemote(repo, branchOneHead, branchOneRemoteHead);
        // update higher-scope variables
        branchOneRemoteAheadBy = branchOneAheadBy.remoteAhead;
        branchOneLocalAheadBy = branchOneAheadBy.localAhead;

        let branchTwoRemoteHead = await nodegit.Commit.lookup(repo, branchTwoRemote.target());

        // get difference in commits local vs. remote for master
        let branchTwoAheadBy = await getDifferenceBetweenLocalRemote(repo, branchTwoHead, branchTwoRemoteHead);

        // update higher-scope variables
        branchTwoRemoteAheadBy = branchTwoAheadBy.remoteAhead;
        branchTwoLocalAheadBy = branchTwoAheadBy.localAhead;

        // get the combined Remote history of branch & master
        remoteHistory = await getMultiBranchHistory(repo,
            branchOneRemoteHead, branchOneRemote, branchOneRemoteAheadBy,
            branchTwoRemoteHead, branchTwoRemote, branchTwoRemoteAheadBy);
    }

    // now that we know if local is ahead, we can
    // get the local history of branch & master
    const localHistory = await getMultiBranchHistory(repo,
        branchOneHead, branchOne, branchOneLocalAheadBy,
        branchTwoHead, branchTwo, branchTwoLocalAheadBy);

    return {
        'local': localHistory,
        'remote': remoteHistory
    };
}

/**
 * Get the history of the repo's currently checked-out branch plus where it branches off of master
 * for both local and remote
 * @param repoPath
 * @returns {Promise<Array<Commit>|{remote: {msg: string}, local: ({merged: *, branches: {branchName: string, history: *}[], isMultiBranch: boolean}|Array)}>}
 */
async function getCurrentBranchHistoryFromMaster(repoPath) {
    const repo = await utils.openRepo(repoPath);

    // get the current checked-out branch's head commit & branch reference
    const currentHead = await repo.getHeadCommit();
    const currentBranch = await repo.getCurrentBranch();

    console.log(currentBranch.name());

    // get the master branch's head commit
    const masterHead = await repo.getMasterCommit();
    const masterBranch = await nodegit.Branch.lookup(repo, "master", nodegit.Branch.BRANCH.LOCAL);

    // check if master is the current branch
    if (currentBranch.name() === masterBranch.name()) {
        // master is the current branch so just return single branch history
        return await getNormalizedSingleBranchHistory(repo, currentHead, currentBranch, COMMITS_TO_DISPLAY);
    }

    // get the full history of both remote & local checked out branch
    const history = await getMultiBranchLocalAndRemoteHistory(repo, masterBranch, masterHead, currentBranch, currentHead);

    if (!history.remote) {
        // check if there is a remote branch with the same name that is just untracked.
        // if there isnt' a remote branch, don't bother showing the remote master
        history.remote = {};
        history.remote.msg = await checkForUntrackedRemote(repo, currentBranch);
        history.remote.branchName = utils.getShortBranchName(currentBranch.name());
    }

    return history;
}

/**
 * Get the local and remote history of a repo's currently checked out branch
 * @param repoPath
 * @returns Obj
 */
async function getCurrentBranchHistory(repoPath) {
    const repo = await utils.openRepo(repoPath);
    // get the local checked-out branch's head commit
    const localHead = await repo.getHeadCommit();
    // get the local branch reference
    const currentBranch = await repo.getCurrentBranch();

    return await getNormalizedSingleBranchHistory(repo, localHead, currentBranch, COMMITS_TO_DISPLAY);
}

module.exports = {
    getNormalizedSingleBranchHistory: getNormalizedSingleBranchHistory,
    getMultiBranchLocalAndRemoteHistory: getMultiBranchLocalAndRemoteHistory,
    checkForUntrackedRemote: checkForUntrackedRemote,
    getCurrentFromMaster: getCurrentBranchHistoryFromMaster,
    getCurrent: getCurrentBranchHistory
};