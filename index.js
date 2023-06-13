const http = require('http');
const WebSocketServer = require('websocket').server;
const express = require('express')
const app = express()
app.use(express.static('public'))
let connection = null;
const httpServer = http.createServer()

app.listen(8081, () => console.log('Listening on port 8081.'));

httpServer.listen(8080, () => console.log('WS Server is listening on Port 8080.'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// keep track of things
const clients = {};
const games = {};
const messages = {};

const websocket = new WebSocketServer({
    httpServer: httpServer,
});

websocket.on('request', (request) => {
    connection = request.accept(null, request.origin);
    connection.on('open', () => console.log("Opened"));
    connection.on('close', () => console.log("Closed")); 
    connection.on('message', (message) => {
        const result = JSON.parse(message.utf8Data);
        // message received from client

        // client attempting to send a chat msg
        if (result.method == 'chat') {
            const msg = result.msg;
            const clientId = result.clientId;
            const gameId = result.gameId;
            const username = result.username;
            const game = games[gameId];

            // if client is not in a valid game, send error
            if (gameId == null) {
                const payLoad = {
                    method: "error",
                    message: "Game ID is invalid."
                }

                const con = clients[clientId].connection;
                return con.send(JSON.stringify(payLoad));
            }

            messages[gameId].push({
                clientId: clientId,
                msg: msg,
                username: username,
            })

            const payLoad = {
                method: 'chat',
                messages: messages[gameId]
            }

            game?.clients?.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        // client attempting to create a game
        if (result.method == 'create') {
            const clientId = result.clientId;
            const colour = result.colour;
            const username = result.username;
            const position = {x: 0, y: 0};
            const gameId = guid()
            games[gameId] = {
                id: gameId,
                clients: []
            }

            messages[gameId] = [];

            const game = games[gameId];
            console.log(`Username: ${username}`);

            game?.clients?.push({
                clientId,
                colour,
                username,
                position,
            })

            console.log(game?.clients.length);

            const payLoad = {
                method: 'create',
                game: game
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad))
        }

        // client attempting to join a game
        if (result.method == 'join') {
            // handle join things
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            const colour = result.colour;  
            const username = result.username;
            const position = {x: 0, y: 0};

            if (!game) {
                const payLoad = {
                    method: 'error',
                    message: 'Game ID is invalid.'
                }
                return clients[clientId].connection.send(JSON.stringify(payLoad))
            }

            for (let i = 0; i < game.clients.length; i++) {
                if (game.clients[i].clientId === clientId) {
                    const payLoad = {
                        method: 'error',
                        message: 'You are already in this game.'
                    }
                    console.log("User is already in game.");

                    return clients[clientId].connection.send(JSON.stringify(payLoad));
                }
            }

            game?.clients?.push({
                clientId,
                colour,
                username,
                position,
            })

            
            console.log(game?.clients);
            const payLoad = {
                method: 'join',
                game: game
            }

            game?.clients?.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        if (result.method == 'join-random') {
            var gameId = null;
            let game = null;
            let payLoad = null;
            const clientId = result.clientId;
            const colour = result.colour;  
            const username = result.username;
            const position = result.position;

            // if there are existing games, randomly choose one
            if (Object.keys(games).length > 0) {
                var keys = Object.keys(games);
                game = games[keys[ keys.length * Math.random() << 0]];
                gameId = game.id;

                game?.clients?.push({
                    clientId,
                    colour,
                    username,
                    position,
                })

                payLoad = {
                    method: 'join',
                    game: game,
                }

                // no games exist
            } else {
                payLoad = {
                    method: 'error',
                    message: 'No games are currently running. Create one instead.'
                }
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad))
        }

    });

    // generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        connection: connection,
    };

    const payLoad = {
        method: 'connect',
        clientId: clientId,
    };

    // send back the client connect
    connection.send(JSON.stringify(payLoad));

});

const loop = () => {
    for (const gameId in games) {
        const payLoad = {
            method: 'update',
            clients: games[gameId].clients
        }
        for (const i in games[gameId].clients) {
            let clientId = games[gameId].clients[i].clientId;
            clients[clientId].connection.send(JSON.stringify(payLoad));
        }
    }
}

setInterval(loop, 1000 / 30);

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () =>
    (
        S4() +
        S4() +
        '-' +
        S4() +
        '-4' +
        S4().substr(0, 3) +
        '-' +
        S4() +
        '-' +
        S4() +
        S4() +
        S4()
    ).toLowerCase();
