const express = require('express');
const expressSession = require('express-session');
const socket = require('socket.io');
const chokidar = require('chokidar');

const branches = require('./branches');
const files = require('./files');

// TODO: confirm that the repo path is a legit git instance
// and error out if it isn't
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

app.use(session);

// create a new server
server = app.listen(port, function(req, res, next){
    console.log('server is running on port 5000')
});

//socketize this bad boy
sio = socket(server);

sio.use(function(socket, next) {
    session(socket.request, {}, next);
});

app.use(session);

sio.on('connection', async (socket) => {
    console.log('Socket created: ' + socket.id);

    let sessionData = socket.request.session;

    // initialize settings
    sessionData.settings = {
        showWithMaster: true,
    };

    sessionData.save();

    const data = await getStatus(sessionData.settings);
    sio.emit('UPDATE', data);

    // watch for any file changes
    watcher.on('all', async (event, path) => {
        console.log(event, path);
        // if (path.indexOf('/objects/') < 0 && path.indexOf('.git/index') < 0) {
        //     console.log('\n');
        //     file = fs.readFileSync(path, 'utf-8');
        //     console.log(file);
        //     console.log('\n');
        // }
        const data = await getStatus(sessionData.settings);
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