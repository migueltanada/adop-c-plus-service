require('express-group-routes');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const dockerRouter = require('./app/routes/v1/docker');

app.set('port', process.env.PORT || 5000)
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.group('/api/v1', (router) => {
    router.use('/docker', dockerRouter)
});

app.get('/test', function(req, res) {
    res.sendFile(`${__dirname}/views/test.html`);
});

const executeScript = function (socket, command) {
    var process = exec(command)

    process.stdout.setEncoding('utf-8');
    process.stdout.on('data', function (data) {
        socket.emit('logs', data);
    });
    process.stderr.setEncoding('utf-8');
    process.stderr.on('data', function (data) {
        socket.emit('err-logs', data);
    });
};

io.on('connection', function(socket) {
    socket.on('execute', (command) => {
        executeScript(socket, command);
    });
});

http.listen(app.get('port'), () => {
    console.log(`Node app is running on port ${app.get('port')}`)
});
