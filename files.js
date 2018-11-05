const nodegit = require("nodegit");
const utils = require("./utils");

/**
 * Utiity function to get the file details we care about
 * @param file
 * @returns {{path: *}}
 */
function getDeets(file) {
    return {
        "path": file.path(),
        "status": file.status(),
    }
}

/**
 * Get the status of the index and the workspace
 * @param repoPath
 * @returns {Obj}
 */
async function getStatus(repoPath) {
    const repo = await utils.openRepo(repoPath);

    const statuses = await repo.getStatus();

    const index = statuses.filter(file => file.inIndex());

    const working = statuses.filter(file => file.inWorkingTree());

    return {
        "index": index.map(getDeets),
        "workspace": working.map(getDeets),
    };
}

module.exports.get = getStatus;