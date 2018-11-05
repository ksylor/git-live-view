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

module.exports.openRepo = openRepo;