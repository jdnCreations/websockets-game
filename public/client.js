let messages = [];
let clientId = null;
let gameId = null;
let playerColour = null;
let username = null;
let errorText = null;
let playersOnServer = [];
let playerPosX = null;
let playerPosY = null;
let ws = new WebSocket("ws://localhost:8080");


// html elements
const txtCurrGameId = document.getElementById("txtCurrGameId")
const btnJoin = document.getElementById("btnJoin")
const btnRandom = document.getElementById("btnRandom")
const btnCreate = document.getElementById("btnCreate")
// const btnChat = document.getElementById("btnChat")
const txtGameId = document.getElementById("txtGameId")
const txtChat = document.getElementById("txtChat")
const errorDisplay = document.getElementById("error");
const chat = document.getElementById("chat");
const playerName = document.getElementById("playerName");
const playerColourInput = document.getElementById("playerColour");
const playerList = document.getElementById("playerList");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
canvas.style.border = "1px solid black";

// event listeners
txtGameId.addEventListener("keydown", () => {
    if (txtGameId.classList.contains("text-input-error"))
        txtGameId.classList.remove("text-input-error")
})

// btnchat.addEventListener('click', () => {
//     let chatMsg = txtChat.value;
//     username = playerName.value;
// 
//     const payLoad = {
//         method: 'chat',
//         msg: chatMsg,
//         clientId: clientId,
//         gameId: gameId,
//         username: username
//     }
// 
//     ws.send(JSON.stringify(payLoad))
// })

btnCreate.addEventListener('click', () => {
    username = playerName.value;
    playerColour = playerColourInput.value;
    const payLoad = {
        method: 'create',
        username,
        clientId,
        colour: playerColour,
        
    }
    ws.send(JSON.stringify(payLoad))
})


btnJoin.addEventListener('click', () => {
    if (checkInputs() == "error") {
        return;
    }
    playerColour = playerColourInput.value;
    username = playerName.value;
    if (gameId == null) 
        gameId = txtGameId.value;


    const payLoad = {
        method: 'join',
        username,
        clientId,
        gameId,
        colour: playerColour
    }

    console.log(payLoad.gameId);
    ws.send(JSON.stringify(payLoad))
})

btnRandom.addEventListener('click', e => {
    username = playerName.value;
    const payLoad = {
        method: 'join-random',
        username,
        clientId,
    }
    ws.send(JSON.stringify(payLoad))
})

ws.onmessage = (message) => {
    // message data
    const response = JSON.parse(message.data);
    console.log(response)
    // connect
    if (response.method === 'connect') {
        clientId = response.clientId;
    }

    // receive message
    if (response.method === 'chat') {
        messages = response.messages;

        // remove previous chat messages
        for (let i = 0; i < chat.children.length; i++) {
            chat.removeChild(chat.firstChild)
        }

        for (let i = 0; i < messages.length; i++) {
            // create new p element
            let newDiv = document.createElement("div")
            let newName = document.createElement('p')
            let newMsg = document.createElement('p')

            newDiv.classList.add("message"); 
            newMsg.classList.add("message-text"); 
            newName.classList.add("name");
            
            newName.innerText = messages[i].username;
            newMsg.innerText = messages[i].msg;

            newDiv.appendChild(newName)
            newDiv.appendChild(newMsg)
            chat.appendChild(newDiv)
        }
    }

    // create game
    if (response.method === 'create') {
        playerColour = playerColourInput.value;
        username = username
        gameId = response.game.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
        // drawPlayer(playerColour);
    }

    if (response.method === 'error') {
        errorDisplay.innerText = response?.message
    }

    if (response.method === 'join') {
        playersOnServer = response.game.clients;
        txtCurrGameId.innerText = `Current Game ID: ${response.game.id}`;
        for (let i = 0; i < playersOnServer.length; i++) {
            console.log(playersOnServer[i].username);
            drawAllPlayers();
            playerList.innerText += `,  ${playersOnServer[i].username}`;
        }
    }
    
    if (response.method == 'update') {
        console.log(response);
    }

    if (response.method === 'join-random') {
        console.log(response.game)
        gameId = response?.game?.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
    }
}
const drawAllPlayers = () => {
    var offset = 50;
    playersOnServer.forEach(p => {
        drawPlayer(p, offset);
        offset += 50;
    });
}

const drawPlayer = (player, offset) => {
    const radius = 45;

    ctx.lineWidth = 3;
    ctx.fillStyle = player.colour;

    ctx.beginPath();
    ctx.arc(player.position.x + offset, player.position.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}


const checkInputs = () => {
    const invalid = []

    if (gameId == null && txtGameId.value == "") {
        invalid.push(txtGameId)
    }

    if (username == null && playerName.value == "") {
        invalid.push(playerName)
    }

    if (invalid.length > 0) {
        for (let i = 0; i < invalid.length; i++) {
            invalid[i].classList.add("text-input-error")
        }
        return "error";
    }
}

