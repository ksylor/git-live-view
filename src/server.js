const express = require('express');
const expressSession = require('express-session');
const socket = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const nodegit = require('nodegit');
const equal = require('deep-equal');

const branches = require('./branches');
const files = require('./files');
const rebase = require('./rebase');
const utils = require('./utils');

const DEFAULT_SETTINGS = {
    showWithMaster: false,
    commitsToDisplay: 8,
    mergedHistoryLength: 3,
};

// get the repo at the path passed in via command line
// TODO: confirm that the repo path is a legit git instance
const repoPath = process.argv[2].split('=')[1];
console.log('Repo path: ' + repoPath);

// start watching files
watcher = chokidar.watch(repoPath, {ignored: /\.swp/});

// set up the server
const app = express();
const port = process.env.PORT || 5000;

// create a session to manage data storage between socket and express
const session = expressSession({
    'secret' : 'unicorns',
    'resave': false,
    'saveUninitialized': true,
});

// add the session middleware
app.use(session);

// create a new server
server = app.listen(port, function(req, res, next) {
    console.log('server is running on port 5000')
});

//socketize this bad boy
sio = socket(server);

sio.use(function(socket, next) {
    session(socket.request, {}, next);
});

app.use(session);

// everything that happens during a session goes in here
sio.on('connection', async function(socket) {
    console.log('Socket created: ' + socket.id);
    socket.on("disconnect", () => console.log("Client disconnected"));

    socket.on('TEST', function(data) {
        console.log("TEST", data);
    });

    // setup initial session data
    let sessionData = socket.request.session;

    // initialize settings
    sessionData.settings = DEFAULT_SETTINGS;
    sessionData.history = [];
    sessionData.save();

    // get the current repo status and emit to client
    updateStatus(socket, sessionData);

    // watch for any file changes in the git repo and
    // send updated status to the client
    watcher.on('all', async (event, path) => {
        console.log("file change", event, path);
        updateStatus(socket, sessionData);
    });

    // handle when user changes settings in the UI
    socket.on('UPDATE_SETTINGS', async function(settings) {
        console.log('SETTINGS', settings);
        sessionData.settings = settings;
        sessionData.save();

        // get new data with new settings
        updateStatus(socket, sessionData);
    });
});

async function updateStatus(socket, sessionData) {
    let data;
    let repo = await utils.openRepo(repoPath);

    if (repo.isRebasing()) {
        data = await getRebaseStatus(sessionData.settings);
    } else if (repo.isMerging()) {
        // merge in progress
        // do something to handle it
    } else {
        data = await getStatus(sessionData.settings);
    }

    if (!equal(sessionData.history[sessionData.history.length - 1], data)) {
        console.log("new state!");
        sessionData.history.push(data);
        sessionData.save();

        socket.emit('UPDATE', data);
    }
}

async function getStatus(settings) {
    const branchStatus = settings.showWithMaster
        ? await branches.getCurrentFromMaster(repoPath, settings)
        : await branches.getCurrent(repoPath, settings);

    const fileStatus = await files.get(repoPath, settings);

    return {
        settings: settings,
        ...branchStatus,
        ...fileStatus
    };
}

async function getRebaseStatus(settings) {
    const rebaseStatus = await rebase.getRebase(repoPath, settings);

    console.log(rebaseStatus);

    const fileStatus = await files.get(repoPath, settings);

    return {
        rebaseInProgress: true,
        settings: settings,
        ...rebaseStatus,
        ...fileStatus
    }
}