const express = require('express');
const branches = require('./branches');
const files = require('./files');
const socket = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');

const repoPath = process.argv[2].split('=')[1];
console.log('Repo path: ' + repoPath);

// set up the server
const app = express();
const port = process.env.PORT || 5000;

// start watching files
watcher = chokidar.watch(repoPath, {ignored: /\.swp/});

// create a new server
server = app.listen(port, function(){
    console.log('server is running on port 5000')
});

//socketize this bad boy
io = socket(server);

io.on('connection', async (socket) => {
    console.log('Socket created: ' + socket.id);

    const data = await getStatus();
    io.emit('UPDATE', data);

    // watch for any file changes
    watcher.on('all', async (event, path) => {
        console.log(event, path);
        // if (path.indexOf('/objects/') < 0 && path.indexOf('.git/index') < 0) {
        //     console.log('\n');
        //     file = fs.readFileSync(path, 'utf-8');
        //     console.log(file);
        //     console.log('\n');
        // }
        const data = await getStatus();
        io.emit('UPDATE', data);
    });
});

async function getStatus() {
    const branchStatus = await branches.get(repoPath);

    const fileStatus = await files.get(repoPath);

    return {
        "branches": branchStatus,
        "files": fileStatus,
    };
}

app.get('/api/status', async (req, res) => {
    res.json(getStatus());
});