const concurrently = require('concurrently');

const args = process.argv.slice(2).join(' ');

concurrently(
    [
        { command: 'npm:server -- ' + args, prefixColor: 'blue', name: 'server' },
        { command: 'npm:client', prefixColor: 'magenta', name: 'client' }
    ],
    {
        killOthers: ['failure', 'success']
    }
);

// "concurrently --kill-others-on-fail \"npm run server\" \"npm run client\""