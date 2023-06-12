let messages = [];
let clientId = null;
let gameId = null;
let playerColour = null;
let username = null;
let errorText = null;
let playersonserver = [];
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
    const payLoad = {
        method: 'create',
        clientId: clientId
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
        gameId = response.game.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
        drawPlayer(playerColour);
    }

    if (response.method === 'error') {
        errorDisplay.innerText = response?.message
    }

    if (response.method === 'join') {
        console.log(response.game)
        txtCurrGameId.innerText = `Current Game ID: ${response.game.id}`;
        console.log(response.colour);
        drawPlayer(playerColour);
    }

    if (response.method === 'join-random') {
        console.log(response.game)
        gameId = response?.game?.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
    }
}

const drawPlayer = (playerColour) => {
    const X = canvas.width / 2;
    const Y = canvas.height / 2;
    const radius = 45;

    playerPosX = X;
    playerPosY = Y;

    ctx.lineWidth = 3;
    ctx.fillStyle = playerColour;

    ctx.beginPath();
    ctx.arc(X, Y, radius, 0, 2 * Math.PI, false);
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

