const express = require('express');
const expressSession = require('express-session');
const socket = require('socket.io');
const chokidar = require('chokidar');

const branches = require('./branches');
const files = require('./files');

const DEFAULT_SETTINGS = {
    showWithMaster: true,
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

sio.on('connection', async function(socket) {
    console.log('Socket created: ' + socket.id);

    let sessionData = socket.request.session;

    // initialize settings
    sessionData.settings = DEFAULT_SETTINGS;
    sessionData.save();

    // get the initial status
    const data = await getStatus(sessionData.settings);
    // send data to client
    sio.emit('UPDATE', data);

    // watch for any file changes in the git repo and
    // send updated status to the client
    watcher.on('all', async (event, path) => {
        console.log(event, path);
        // get updated status
        const data = await getStatus(sessionData.settings);

        // TODO: only send update if the data has changed
        sio.emit('UPDATE', data);
    });

    // handle when user changes settings in the UI
    sio.on('SETTINGS', async function(settings) {
        sessionData.settings = settings;
        sessionData.save();

        // get new data with new settings
        const data = await getStatus(sessionData.settings);

        // TODO: only send update if the data has changed
        sio.emit('UPDATE', data);
    });
});

async function getStatus(settings) {
    const branchStatus = settings.showWithMaster
        ? await branches.getCurrentFromMaster(repoPath)
        : await branches.getCurrent(repoPath);

    const fileStatus = await files.get(repoPath);

    return {
        settings: settings,
        ...branchStatus,
        ...fileStatus
    };
}

app.get('/api/status', async (req, res) => {
    res.json(getStatus());
});