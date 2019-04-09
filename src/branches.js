const nodegit = require("nodegit");
const utils = require("./utils");

const goBackCommits = 5;

/**
 * Gets the specified number of commits in history starting
 * from the commit passed in
 * @param repo
 * @param commit
 * @param numCommits
 * @returns {Promise<Array<Commit>>}
 */
async function getHistory(repo, commit, numCommits) {
    var walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(commit.id());
    return walker.getCommits(numCommits);
}

/**
 * Gets the history in between the start commit and the end commits
 * if start & end commits are the same returns empty array
 * @param repo
 * @param startCommit
 * @param endCommitId
 * @returns {Promise<Array<Commit>>}
 */
async function getHistoryUntil(repo, startCommit, endCommitId) {
    if (startCommit.id().equal(endCommitId)) {
        return [];
    }

    var walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(startCommit.id());

    return walker.getCommitsUntil(function(checkCommit) {
        return !checkCommit.id().equal(endCommitId);
    });
}

/**
 * Get the remote branch ref, if it exists
 * @param branch
 * @returns {Promise<Reference>}
 */
async function getRemote(branch) {
    let remoteRef;
    await nodegit.Branch.upstream(branch)
        .then(function(remote) {
            remoteRef = remote;
        }).catch(function(err) {
            // there isn't a remote ref
            remoteRef = null;
        });
    return remoteRef;
}

/**
 * It's possible to push up a branch to remote without
 * setting it as a tracking branch, check for that state
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

function getShortBranchName(longname) {
    return longname
        .replace("refs/remotes/origin/", "")
        .replace("refs/heads/", "");
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
    const remoteBranch = await getRemote(localBranch);

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

        if (!localHead.id().equal(remoteHead.id())) {
            // find the commit where local branches off from remote
            const mergeBase = await nodegit.Merge.base(repo, localHead, remoteHead);

            // calculate how many commits to display so that the merge base commit
            // is on the same line in both local and remote

            // how many commits back do we go in order to find the merge base?
            const partialRemoteHistory = await getHistoryUntil(repo, remoteHead, mergeBase);
            const partialLocalHistory = await getHistoryUntil(repo, localHead, mergeBase);

            // how far ahead of merge base are local and remotes?
            // damn zero indexed arrays
            localAheadBy = Math.max(0, partialLocalHistory.length - 1);
            remoteAheadBy = Math.max(0, partialRemoteHistory.length - 1);

            // how far back does each branch need to go to be aligned?
            // this calculation took me a while, basically figure out the
            // difference in commits and subtract that from the max number of commits,
            // but don't go higher than the max number of commits
            goBackLocal = Math.min((numCommits - (remoteAheadBy - localAheadBy)), numCommits);
            goBackRemote = Math.min((numCommits - (localAheadBy - remoteAheadBy)), numCommits);
        }

        // get the history for remote
        remoteHistory = await getHistory(repo, remoteHead, goBackRemote);

        // get the history for local
        localHistory = await getHistory(repo, localHead, goBackLocal);
    } else {
        // there's no remote so just get the local history back by the max number of commits
        localHistory = await getHistory(repo, localHead, numCommits);

        // check if there is a remote branch with the same name that is just untracked.
        noRemoteMsg = await checkForUntrackedRemote(repo, localBranch);
    }

    return {
        'isMultiBranch' : false,
        'local': {
            'branchName': getShortBranchName(localBranch.name()),
            'history': localHistory.map(function (commit, idx) {
                return {
                    sha: commit.sha(),
                    isAhead: localAheadBy > 0 && idx < localAheadBy,
                }
            }),
        },
        'remote' : {
            'msg': noRemoteMsg,
            'branchName': remoteBranch ? getShortBranchName(remoteBranch.name()) : null,
            'history': remoteHistory ? remoteHistory.map(function (commit, idx) {
                return {
                    sha: commit.sha(),
                    isAhead: remoteAheadBy > 0 && idx < remoteAheadBy,
                }
            }) : null,
        }
    };
}

async function getMultiBranchHistory(repo, branchOneHead, branchOneBranch, branchTwoHead, branchTwoBranch) {
    if (branchOneHead.id().equal(branchTwoHead.id())) {
        // both branches point to the same commit
        // todo fix this to do something
        return [];
    }

    const mergeBase = await nodegit.Merge.base(repo, branchOneHead, branchTwoHead);

    const branchOneHistory = await getHistoryUntil(repo, branchOneHead, mergeBase);
    const branchTwoHistory = await getHistoryUntil(repo, branchTwoHead, mergeBase);

    // the walker includes the merge base commit in the history so we have to remove it
    // from each branch because we want it to be in the merged group
    branchOneHistory.pop();
    branchTwoHistory.pop();

    const mergeCommit = await nodegit.Commit.lookup(repo, mergeBase);
    const mergedHistory = await getHistory(repo, mergeCommit, 3);

    return {
        'isMultiBranch': true,
        'branches': [
            {
                'branchName': getShortBranchName(branchOneBranch.name()),
                'history': branchOneHistory.map(function(commit, idx) {
                    return {
                        sha: commit.sha(),
                        isAhead: false,
                    };
                }),
            },
            {
                'branchName': getShortBranchName(branchTwoBranch.name()),
                'history': branchTwoHistory.map(function(commit, idx) {
                    return {
                        sha: commit.sha(),
                        isAhead: false,
                    };
                }),
            }
        ],
        'merged': mergedHistory.map(function(commit, idx) {
            return {
                sha: commit.sha(),
                isAhead: false,
            };
        })
    };
}

async function getCurrentBranchHistoryFromMaster(repoPath) {
    const repo = await utils.openRepo(repoPath);
    // get the current checked-out branch's head commit
    const currentHead = await repo.getHeadCommit();
    // get the master branch's head commit
    const masterHead = await repo.getMasterCommit();
    // get the current branch reference
    const currentBranch = await repo.getCurrentBranch();

    // check if master is the current branch
    if (currentHead.id().equal(masterHead.id())) {
        // master is the current branch so just return single branch history
        return await getSingleBranchHistory(repo, currentHead, currentBranch, goBackCommits);
    }

    const masterBranch = await nodegit.Branch.lookup(repo, "master", nodegit.Branch.BRANCH.LOCAL);
    const localHistory = await getMultiBranchHistory(repo, masterHead, masterBranch, currentHead, currentBranch);

    // get the corresponding upstream reference
    const remoteBranch = await getRemote(currentBranch);

    let noRemoteMsg;
    let remoteHistory;

    if (remoteBranch) {
        const remoteMaster = await getRemote(masterBranch);

        const remoteMasterHead = await nodegit.Commit.lookup(repo, remoteMaster.target());
        const remoteBranchHead = await nodegit.Commit.lookup(repo, remoteBranch.target());

        remoteHistory = await getMultiBranchHistory(repo, remoteMasterHead, remoteMaster, remoteBranchHead, remoteBranch);
    } else {
        // check if there is a remote branch with the same name that is just untracked.
        noRemoteMsg = await checkForUntrackedRemote(repo, currentBranch);
    }

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

module.exports.getCurrentFromMaster = getCurrentBranchHistoryFromMaster;
module.exports.getCurrent = getCurrentBranchHistory;