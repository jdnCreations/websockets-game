let messages = [];
let clientId = null;
let gameId = null;
let playerColour = null;
let username = null;
let errorText = null;
let playersOnServer = [];
let ws = new WebSocket("ws://localhost:8080");


// html elements
const txtCurrGameId = document.getElementById("txtCurrGameId")
const btnJoin = document.getElementById("btnJoin")
const btnRandom = document.getElementById("btnRandom")
const btnCreate = document.getElementById("btnCreate")
const btnChat = document.getElementById("btnChat")
const txtGameId = document.getElementById("txtGameId")
const txtChat = document.getElementById("txtChat")
const errorDisplay = document.getElementById("error");
const chat = document.getElementById("chat")
const playerName = document.getElementById("playerName")
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
canvas.style.border = "1px solid black"

// event listeners

txtGameId.addEventListener("keydown", e => {
    if (txtGameId.classList.contains("text-input-error"))
        txtGameId.classList.remove("text-input-error")
})

btnChat.addEventListener('click', e => {
    let chatMsg = txtChat.value;
    username = playerName.value;

    const payLoad = {
        method: 'chat',
        msg: chatMsg,
        clientId: clientId,
        gameId: gameId,
        username: username
    }

    ws.send(JSON.stringify(payLoad))
})

btnCreate.addEventListener('click', e => {
    const payLoad = {
        method: 'create',
        clientId: clientId
    }

    ws.send(JSON.stringify(payLoad))
})


btnJoin.addEventListener('click', e => {

    if (checkInputs() == "error") {
        return;
    }

    username = playerName.value;
    if (gameId == null) 
        gameId = txtGameId.value;


    const payLoad = {
        method: 'join',
        username,
        clientId,
        gameId,
    }

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
        console.log('msgs received?')
        messages = response.messages;
        console.log(messages)

        // remove previous chat messages
        for (let i = 0; i < chat.children.length; i++) {
            chat.removeChild(chat.firstChild)
        }

        for (let i = 0; i < messages.length; i++) {
            // create new p element
            let newDiv = document.createElement("div")
            let newName = document.createElement('p')
            let newMsg = document.createElement('p')

            newName.innerText = messages[i].username;
            newMsg.innerText = messages[i].msg;

            newDiv.appendChild(newName)
            newDiv.appendChild(newMsg)
            chat.appendChild(newDiv)
        }
    }

    // create game
    if (response.method === 'create') {
        gameId = response.game.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
    }

    if (response.method === 'error') {
        errorDisplay.innerText = response?.message
    }

    if (response.method === 'join') {
        console.log(response.game)
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
    }

    if (response.method === 'join-random') {
        console.log(response.game)
        gameId = response?.game?.id;
        txtCurrGameId.innerText = `Current Game ID: ${gameId}`;
    }
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


