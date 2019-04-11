const nodegit = require("nodegit");
const utils = require("./utils");

/**
 * Utiity function to get the file details we care about
 * @param file
 * @returns {{path: *}}
 */
function getDeets(file, indexOrWorkspace) {
    return {
        "path": file.path(),
        "status": file.status().filter(
            status => status.split("_")[0] === indexOrWorkspace
        ).map(
            status => status.split("_")[1]
        ),
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

    const index = statuses.filter(
        file => file.inIndex()
    ).map(
        file => getDeets(file, "INDEX")
    );

    const working = statuses.filter(
        file => file.inWorkingTree()
    ).map(
        file => getDeets(file, "WT")
    );

    // conflicted files during merge/rebase are technically not in the workspace
    // but git makes it seem like they are so let's put them in there.
    const conflict = statuses.filter(
        file => file.isConflicted()
    ).map(function(file) {
        return {
            "path": file.path(),
            "status": ["CONFLICT"]
        }
    });

    return {
        "index": index,
        "workspace": [ ...working, ...conflict ]
    };
}

module.exports.get = getStatus;