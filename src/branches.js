const nodegit = require("nodegit");
const utils = require("./utils");

const goBackCommits = 8;

/**
 * It's possible to push up a branch to remote without also
 * setting it up as a tracking branch, check for that state
 * @param repo
 * @param localBranchWitNoRemote
 * @returns {Promise<string>} representing the type of missing remote
 */
async function checkForUntrackedRemote(repo, localBranchWitNoRemote) {
    // branch name will be in the format refs/heads/branch_name
    // TODO how to handle remotes other than origin?
    let remoteName = localBranchWitNoRemote.name().replace('heads', 'remotes/origin');

    return await nodegit.Reference.nameToId(repo, remoteName)
        .then(function(remote) {
            return "MSG_UNTRACKED_REMOTE";
        }).catch(function(err) {
            return "MSG_NO_REMOTE";
        });
}

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
 * gets the history of the local branch and remote upstream branch
 * going back specified number of commits
 * Note: this will normalize the number of commits so that commits in common
 * will be even with each other in the UI
 * @param repo
 * @param numCommits
 * @returns {Promise<Array<Commit>>}
 */
async function getSingleBranchHistory(repo, localHead, localBranch, numCommits) {
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
        const remoteHead = await repo.getReferenceCommit(remoteBranch);

        // calculate how many commits to display so that the merge base commit
        // is on the same line in both local and remote
        const { localAhead, remoteAhead } = await getDifferenceBetweenLocalRemote(repo, localHead, remoteHead);

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
            'branchName': remoteBranch ? utils.getShortBranchName(remoteBranch.name()) : null,
            'history': remoteHistory ? utils.getCommitHistory(remoteHistory, remoteAheadBy) : null,
        }
    };
}

async function getMultiBranchHistory(repo, branchOneHead, branchOneBranch, branchOneAheadBy, branchTwoHead, branchTwoBranch, branchTwoAheadBy) {
    if (branchOneHead.id().equal(branchTwoHead.id())) {
        // both branches point to the same commit
        // todo fix this to do something
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
    const mergedHistory = await utils.getHistory(repo, mergeCommit, 3);

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

async function getCurrentBranchHistoryFromMaster(repoPath) {
    const repo = await utils.openRepo(repoPath);

    // get the current checked-out branch's head commit & branch reference
    const currentHead = await repo.getHeadCommit();
    const currentBranch = await repo.getCurrentBranch();

    // get the master branch's head commit
    const masterHead = await repo.getMasterCommit();
    const masterBranch = await nodegit.Branch.lookup(repo, "master", nodegit.Branch.BRANCH.LOCAL);

    // check if master is the current branch
    if (currentHead.id().equal(masterHead.id())) {
        // master is the current branch so just return single branch history
        return await getSingleBranchHistory(repo, currentHead, currentBranch, goBackCommits);
    }

    let masterRemoteAheadBy = 0;
    let masterLocalAheadBy = 0;

    let branchRemoteAheadBy = 0;
    let branchLocalAheadBy = 0;

    let noRemoteMsg;
    let remoteHistory;

    // get the corresponding upstream reference for this branch
    const remoteBranch = await utils.getRemote(currentBranch);

    if (remoteBranch) {
        // get the remote master info
        const remoteMaster = await utils.getRemote(masterBranch);
        const remoteMasterHead = await nodegit.Commit.lookup(repo, remoteMaster.target());

        // get difference in commits local vs. remote for master
        const masterAheadBy = await getDifferenceBetweenLocalRemote(repo, masterHead, remoteMasterHead);
        masterRemoteAheadBy = masterAheadBy.remoteAhead;
        masterLocalAheadBy = masterAheadBy.localAhead;

        // get the remote branch head
        const remoteBranchHead = await nodegit.Commit.lookup(repo, remoteBranch.target());

        // get difference in commits local vs. remote for current branch
        const branchAheadBy = await getDifferenceBetweenLocalRemote(repo, currentHead, remoteBranchHead);
        branchRemoeAheadBy = branchAheadBy.remoteAhead;
        branchLocalAheadBy = branchAheadBy.localAhead;

        // get the combined Remote history of branch & master
        remoteHistory = await getMultiBranchHistory(repo,
            remoteMasterHead, remoteMaster, masterRemoteAheadBy,
            remoteBranchHead, remoteBranch, branchRemoteAheadBy);
    } else {
        // check if there is a remote branch with the same name that is just untracked.
        // if there isnt' a remote branch, don't bother showing the remote master
        noRemoteMsg = await checkForUntrackedRemote(repo, currentBranch);
    }

    // now that we know if local is ahead, we can
    // get the local history of branch & master
    const localHistory = await getMultiBranchHistory(repo,
        masterHead, masterBranch, masterLocalAheadBy,
        currentHead, currentBranch, branchLocalAheadBy);

    return {
        'local': localHistory,
        'remote': {
            msg: noRemoteMsg,
            ...remoteHistory
        }
    };
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
    return await getSingleBranchHistory(repo, localHead, currentBranch, goBackCommits);
}

module.exports = {
    getCurrentFromMaster: getCurrentBranchHistoryFromMaster,
    getCurrent: getCurrentBranchHistory
};