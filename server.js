const express = require('express');
const branches = require("./branches");
const files = require("./files");

const app = express();
const port = process.env.PORT || 5000;

app.get('/api/hello', (req, res) => {
    res.send({ express: 'Hello From Express hi hi hi' });
});

app.get('/api/status', async (req, res) => {

    const branchStatus = await branches.get("../ohshitgit");

    const fileStatus = await files.get("../ohshitgit");

    res.json({
        "branches": branchStatus,
        "files": fileStatus,
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));