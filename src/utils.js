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
    const commitId = typeof commit === "Commit" ? commit.id() : commit;
    const walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(commitId);
    return walker.getCommits(numCommits);
}

/**
 * gets the specified number of commits in history starting
 * from the passed in commit
 * with structure to display a merge commit
 * @param repo
 * @param commit
 * @param numCommits
 * @returns {Promise<{endHistory: Array<Commit>, mergedHistory: Array<Commit>[], hasMerge: boolean, startHistory}>}
 */
async function getHistoryWithMerges(repo, commit, numCommits) {
    const walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(commit.id());
    let foundMerge = false;
    const startHistory = await walker.getCommitsUntil(function(checkCommit){
        foundMerge = checkCommit.parentcount() > 1;
        return !foundMerge;
    });

    if (foundMerge) {
        let mergeCommit = startHistory[startHistory.length -1];
        let [ parent1Id, parent2Id ] = mergeCommit.parents();
        let mergeBase = await nodegit.Merge.base(repo, parent1Id, parent2Id);
        let b1 = await getHistoryUntil(repo, parent1Id, mergeBase);
        let b2 = await getHistoryUntil(repo, parent2Id, mergeBase);

        // remove the merge base commit
        b1.pop();
        b2.pop();

        let endHistory = await getHistory(repo, mergeBase, numCommits - startHistory.length);

        return {
            hasMerge: true,
            startHistory: startHistory,
            mergedHistory: [b1, b2],
            endHistory: endHistory,
        };
    }

    return startHistory;
}

/**
 * Gets the history in between the start commit and the end commits
 * if start & end commits are the same returns empty array
 * @param repo
 * @param startCommit
 * @param endCommitId
 * @returns {Promise<Array<Commit>>}
 */
async function getHistoryUntil(repo, startCommitId, endCommitId) {
    if (startCommitId.equal(endCommitId)) {
        return [];
    }

    const walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(startCommitId);

    return walker.getCommitsUntil(function(checkCommit) {
        return !checkCommit.id().equal(endCommitId);
    });
}

/**
 * searches the history of a branch for a specific commit
 * returns -1 if the commit wasn't found, else returns the 0-index position of the
 * commit in history
 * @param repo
 * @param branchHead
 * @param commitToFind
 * @returns {Promise<int>}
 */
async function searchHistoryForCommit(repo, branchHead, commitToFind) {
    if (branchHead.id().equal(commitToFind)) {
        return 0;
    }
    const walker = nodegit.Revwalk.create(repo);
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    walker.push(branchHead.id());

    let found = false;
    const history = await walker.getCommitsUntil(function(checkCommit) {
        if (checkCommit.id().equal(commitToFind)) {
            found = true;
        }
        return !checkCommit.id().equal(commitToFind);
    });
    return found ? history.length -1 : -1;
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
        .replace("refs/remotes/", "")
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
            isHead: commit.isHead,
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
    searchHistoryForCommit: searchHistoryForCommit,
    getHistoryWithMerges: getHistoryWithMerges,
};