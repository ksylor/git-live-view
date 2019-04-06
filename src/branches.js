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

async function getHistoryUntil(repo, startCommit, endCommitId) {
    if (startCommit.id().toString() === endCommitId.toString()) {
        return [];
    }

    var walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(startCommit.id());
    return walker.getCommitsUntil(function(checkCommit) {
        return checkCommit.id().toString() !== endCommitId.toString();
    });
}

/**
 * Get the remote branch ref, if it exists
 * @param branch
 * @returns <Reference>
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
 * @param branch
 * @returns string representing the type of missing remote
 */
async function checkForUntrackedRemote(repo, localBranch) {
    // branch name will be in the format refs/heads/branch_name
    // TODO figure out about remotes other than origin
    // let remoteName = localBranch.name().substr(11);
    let remoteName = localBranch.name().replace('heads', 'remotes/origin');

    return await nodegit.Reference.nameToId(repo, remoteName)
        .then(function(remote) {
            return "MSG_UNTRACKED_REMOTE";
        }).catch(function(err) {
            return "MSG_NO_REMOTE";
        });

    // return await nodegit.Branch.lookup(repo, 'master', nodegit.Branch.BRANCH.REMOTE)
    //     .then(function(remote) {
    //         // there is a remote with the same name
    //         return "MSG_UNTRACKED_REMOTE";
    //     }).catch(function(err) {
    //         console.log(err);
    //         return "MSG_NO_REMOTE";
    //     });
}

/**
 * gets the history of the remote upstream for the currently
 * checked out branch going back specified number of commits
 * @param repo
 * @param numCommits
 * @returns {Promise<Array<Commit>>}
 */
async function getHeadHistory(repo, numCommits) {
    // get the local checked-out branch's head commit
    const localHead = await repo.getHeadCommit();

    // get the local branch reference
    const currentBranch = await repo.getCurrentBranch();
    // get the corresponding upstream reference
    const remoteBranch = await getRemote(currentBranch);

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

        if (localHead.id().toString() !== remoteHead.id().toString()) {
            // find the commit where local branches from remote
            const mergeBase = await nodegit.Merge.base(repo, localHead, remoteHead);

            // calculate how many commits to display so that the merge base commit
            // is on the same line in both local and remote

            // how many commits back do we go back to find the merge base?
            const partialRemoteHistory = await getHistoryUntil(repo, remoteHead, mergeBase);
            const partialLocalHistory = await getHistoryUntil(repo, localHead, mergeBase);


            // damn zero indexed arrays
            localAheadBy = Math.max(0, partialLocalHistory.length - 1);
            remoteAheadBy = Math.max(0, partialRemoteHistory.length - 1);

            // this calculation took me a while, basically figure out the
            // difference in commits and subtract that from the number of commits,
            // but don't go higher than the number of commits
            goBackLocal = Math.min((numCommits - (remoteAheadBy - localAheadBy)), numCommits);
            goBackRemote = Math.min((numCommits - (localAheadBy - remoteAheadBy)), numCommits);
        }

        // get the history for remote
        remoteHistory = await getHistory(repo, remoteHead, goBackRemote);

        // get the history for local
        localHistory = await getHistory(repo, localHead, goBackLocal);
    } else {
        // there's no remote so just get the local history back by the number of commits
        localHistory = await getHistory(repo, localHead, numCommits);

        // check if there is a remote branch with the same name that is just untracked.
        noRemoteMsg = await checkForUntrackedRemote(repo, currentBranch);

        console.log(noRemoteMsg);
    }

    return {
        'local': {
            'branchName': currentBranch.name().replace("refs/heads/", ""),
            'history': localHistory.map(function (commit, idx) {
                return {
                    sha: commit.sha(),
                    isAhead: localAheadBy > 0 && idx < localAheadBy,
                }
            }),
        },
        'remote' : {
            'msg': noRemoteMsg,
            'branchName': remoteBranch ? remoteBranch.name().replace("refs/remotes/", "") : null,
            'history': remoteHistory ? remoteHistory.map(function (commit, idx) {
                return {
                    sha: commit.sha(),
                    isAhead: remoteAheadBy > 0 && idx < remoteAheadBy,
                }
            }) : null,
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
    const hist = await getHeadHistory(repo, goBackCommits);
    return await hist;
}

module.exports.get = getCurrentBranchHistory;