const nodegit = require("nodegit");
const path = require("path");

/**
 * Open a repository at the specified path
 * @param repoPath
 * @returns {Promise<Repository>}
 */
async function openRepo(repoPath) {
    repoPath = repoPath || "../ohshitgit";
    const resolvedPath = path.resolve(repoPath);
    return nodegit.Repository.open(resolvedPath);
}

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
 * remove the refs/* path from the branch name
 * @param longname
 * @returns {string}
 */
function getShortBranchName(longname) {
    return longname
        .replace("refs/remotes/origin/", "")
        .replace("refs/heads/", "");
}

/**
 * given an array of commit history, return an array of commit information we care about
 * for display purposes
 * @param history
 * @param branchAheadBy
 * @returns {*}
 */
function getCommitHistory(history, branchAheadBy) {
    return history.map(function(commit, idx) {
        return {
            sha: commit.sha(),
            isAhead: branchAheadBy > 0 && idx < branchAheadBy,
        };
    });
}

module.exports = {
    openRepo: openRepo,
    getHistory: getHistory,
    getHistoryUntil: getHistoryUntil,
    getRemote: getRemote,
    getShortBranchName: getShortBranchName,
    getCommitHistory: getCommitHistory,
};