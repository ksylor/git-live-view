const nodegit = require("nodegit");
const utils = require("./utils");

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
 * gets the history of the remote upstream for the currently
 * checked out branch going back specified number of commits
 * @param repo
 * @param numCommits
 * @returns {Promise<Array<Commit>>}
 */
async function getHeadHistory(repo, numCommits) {
    // get the local checked-out branch's head commit
    const head = await repo.getHeadCommit();

    // get the history back from that commit
    const localHistory = await getHistory(repo, head, numCommits);

    // get the local branch reference
    const currentBranch = await repo.getCurrentBranch();

    // get the corresponding upstream reference
    const remoteBranch = await getRemote(currentBranch);

    let remoteHistory;

    if (remoteBranch) {
        // get the tip commit of the remote branch
        const remoteHead = await repo.getReferenceCommit(remoteBranch);

        // get the history back from that commit
        remoteHistory = await getHistory(repo, remoteHead, numCommits);
    }

    return {
        'currentBranch': currentBranch.name(),
        'localHistory': localHistory.map(function(commit) { return commit.sha() }),
        'remoteBranch': remoteBranch ? remoteBranch.name() : "No upstream branch",
        'remoteHistory': remoteHistory ? remoteHistory.map(function(commit) { return commit.sha() }) : null,
    };
}

/**
 * Get the local and remote history of a repo's currently checked out branch
 * @param repoPath
 * @returns Obj
 */
async function getCurrentBranchHistory(repoPath) {
    const repo = await utils.openRepo(repoPath);
    const hist = await getHeadHistory(repo, 10);
    return await hist;
}

module.exports.get = getCurrentBranchHistory;