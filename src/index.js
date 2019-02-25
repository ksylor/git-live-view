const branches = require("./branches");
const files = require("./files");

branches.get("../ohshitgit").then(function(hist) {
    console.log(hist);
});

files.get("../ohshitgit").then(function(status) {
    console.log(status);
});



