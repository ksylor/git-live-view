const express = require('express');
const branches = require("./branches");
const files = require("./files");
var socket = require('socket.io');
const chokidar = require('chokidar');

const app = express();
const port = process.env.PORT || 5000;

watcher = chokidar.watch("../ohshitgit", {ignored: /\.swp/});

server = app.listen(5000, function(){
    console.log('server is running on port 5000')
});

io = socket(server);

io.on('connection', async (socket) => {
    console.log(socket.id);

    const data = await getStatus();
    io.emit('UPDATE', data);

    // watch for any file changes
    watcher.on('all', async (event, path) => {
        console.log(event, path);
        const data = await getStatus();
        io.emit('UPDATE', data);
    });
});

async function getStatus() {
    const branchStatus = await branches.get("../ohshitgit");

    const fileStatus = await files.get("../ohshitgit");

    return {
        "branches": branchStatus,
        "files": fileStatus,
    };
}

app.get('/api/status', async (req, res) => {
    res.json(getStatus());
});