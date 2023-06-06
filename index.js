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
  connection.on('close', () => console.log('Closed'));
  connection.on('message', (message) => {
    const result = JSON.parse(message.utf8Data);
    // message received from client

    // console.log(result)

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

      console.log(messages)

      game?.clients?.forEach(c => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad))
      })
    }

    // client attempting to create a game
    if (result.method == 'create') {
      const clientId = result.clientId;
      const gameId = guid()
      games[gameId] = {
        id: gameId,
        clients: []
      }

      messages[gameId] = [];

      const game = games[gameId]

      const payLoad = {
        method: 'create',
        game: game
      }

      game?.clients?.push({
        clientId,
      })

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad))

      console.log(games)
    }

    // client attempting to join a game
    if (result.method == 'join') {
      // handle join things
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];

      if (!game) {
        console.log("No game ID.")
        const payLoad = {
          method: 'error',
          message: 'Game ID is invalid.'
        }
        return clients[clientId].connection.send(JSON.stringify(payLoad))
      }
      
      game?.clients?.push({
        clientId,
      })

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
      console.log(`${result.username} is attempting to join a random game`)
      // select game from games and send gameId back?
      // getRandomGame()
      if (Object.keys(games).length > 0) {
        let rand = Math.random() * games.size()
        print(`games: ${games}, rand: ${rand}`)
      } else {
        gameId = guid()
        games[gameId] = {
          id: gameId,
          clients: []
        };
      }
      
      const payLoad = {
        method: 'join-random',
        game: games[gameId]
      }
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad))

      console.log(games)
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
